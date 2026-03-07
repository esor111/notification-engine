import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { appConfig } from '../../../common/config/configuration';
import { UserRole } from '../../users/user-role';

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshSessionId: string;
};

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async issueTokenPair(
    user: { id: string; email: string; role: UserRole },
    sessionId = randomUUID(),
  ): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        secret: appConfig.auth.accessTokenSecret,
        expiresIn: appConfig.auth.accessTokenExpiresInSeconds,
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        sessionId,
      },
      {
        secret: appConfig.auth.refreshTokenSecret,
        expiresIn: `${appConfig.auth.refreshTokenExpiresInDays}d`,
      },
    );

    return {
      accessToken,
      refreshToken,
      refreshSessionId: sessionId,
    };
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ sub: string; email: string; sessionId: string }> {
    return this.jwtService.verifyAsync(token, {
      secret: appConfig.auth.refreshTokenSecret,
    });
  }

  getRefreshExpiryDate(): Date {
    return new Date(Date.now() + appConfig.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000);
  }
}
