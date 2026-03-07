import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { mqConfig } from '../../../common/mq/mq.config';
import { OutboxService } from '../../../common/mq/outbox.service';
import { UserDto, toUserDto } from '../../users/dto/user.dto';
import { UsersRepository } from '../../users/repository/users.repository';
import { LocalCredentialsRepository } from '../repository/local-credentials.repository';
import { RefreshSessionsRepository } from '../repository/refresh-sessions.repository';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
    private readonly localCredentialsRepository: LocalCredentialsRepository,
    private readonly refreshSessionsRepository: RefreshSessionsRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly outboxService: OutboxService,
  ) {}

  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponseDto> {
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    return this.dataSource.transaction(async (manager) => {
      const existingUser = await this.usersRepository.findByEmail(dto.email, manager);
      if (existingUser) {
        throw new ConflictException('A user with this email already exists');
      }

      const user = await this.usersRepository.createAndSave(
        {
          email: dto.email,
          fullName: dto.fullName,
        },
        manager,
      );

      await this.localCredentialsRepository.createAndSave(user.id, passwordHash, manager);
      await this.outboxService.enqueue(
        {
          eventType: 'user.created',
          aggregateType: 'user',
          aggregateId: user.id,
          queue: mqConfig.userCreatedQueue,
          dedupeKey: `user.created:${user.id}`,
          payload: {
            userId: user.id,
            email: user.email,
            occurredAt: new Date().toISOString(),
          },
        },
        manager,
      );

      return this.createAuthResponse(user.id, user.email, meta, manager);
    });
  }

  async login(
    dto: LoginDto,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const credential = await this.localCredentialsRepository.findByUserId(user.id);
    if (!credential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await this.passwordService.verifyPassword(
      dto.password,
      credential.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.dataSource.transaction((manager) =>
      this.createAuthResponse(user.id, user.email, meta, manager),
    );
  }

  async refresh(
    refreshToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshTokenOrThrow(refreshToken);

    return this.dataSource.transaction(async (manager) => {
      const session = await this.refreshSessionsRepository.findActiveById(
        payload.sessionId,
        manager,
      );
      if (!session) {
        throw new UnauthorizedException('Refresh session is no longer active');
      }

      const expectedHash = this.passwordService.hashRefreshToken(refreshToken);
      if (session.tokenHash !== expectedHash || session.userId !== payload.sub) {
        throw new UnauthorizedException('Refresh token is invalid');
      }

      await this.refreshSessionsRepository.revoke(session.id, manager);
      return this.createAuthResponse(payload.sub, payload.email, meta, manager);
    });
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = await this.verifyRefreshTokenOrThrow(refreshToken);
    await this.refreshSessionsRepository.revoke(payload.sessionId);
  }

  async me(userId: string): Promise<UserDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    return toUserDto(user);
  }

  private async createAuthResponse(
    userId: string,
    email: string,
    meta: { userAgent?: string; ipAddress?: string },
    manager?: EntityManager,
  ): Promise<AuthResponseDto> {
    const user = await this.usersRepository.findById(userId, manager);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is not active');
    }

    const sessionId = randomUUID();
    const tokens = await this.tokenService.issueTokenPair(
      { id: user.id, email: user.email },
      sessionId,
    );
    await this.refreshSessionsRepository.createAndSave(
      {
        id: tokens.refreshSessionId,
        userId: user.id,
        tokenHash: this.passwordService.hashRefreshToken(tokens.refreshToken),
        expiresAt: this.tokenService.getRefreshExpiryDate(),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
      },
      manager,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: toUserDto(user),
    };
  }

  private async verifyRefreshTokenOrThrow(refreshToken: string) {
    try {
      return await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
