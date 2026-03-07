import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { OutboxService } from '../../src/common/mq/outbox.service';
import { UsersRepository } from '../../src/modules/users/repository/users.repository';
import { AuthService } from '../../src/modules/auth/service/auth.service';
import { LocalCredentialsRepository } from '../../src/modules/auth/repository/local-credentials.repository';
import { RefreshSessionsRepository } from '../../src/modules/auth/repository/refresh-sessions.repository';
import { PasswordService } from '../../src/modules/auth/service/password.service';
import { TokenService } from '../../src/modules/auth/service/token.service';

describe('AuthService', () => {
  let service: AuthService;
  const usersRepository = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    createAndSave: jest.fn(),
  };
  const localCredentialsRepository = {
    findByUserId: jest.fn(),
    createAndSave: jest.fn(),
  };
  const refreshSessionsRepository = {
    createAndSave: jest.fn(),
    findActiveById: jest.fn(),
    revoke: jest.fn(),
  };
  const passwordService = {
    hashPassword: jest.fn(),
    verifyPassword: jest.fn(),
    hashRefreshToken: jest.fn(),
  };
  const tokenService = {
    issueTokenPair: jest.fn(),
    verifyRefreshToken: jest.fn(),
    getRefreshExpiryDate: jest.fn(),
  };
  const outboxService = {
    enqueue: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(
      async (callback: (manager: object) => Promise<unknown>) => callback({}),
    );
    tokenService.issueTokenPair.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshSessionId: 'session-1',
    });
    tokenService.getRefreshExpiryDate.mockReturnValue(new Date('2026-04-07T00:00:00.000Z'));
    passwordService.hashRefreshToken.mockReturnValue('refresh-token-hash');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DataSource, useValue: dataSource },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: LocalCredentialsRepository, useValue: localCredentialsRepository },
        { provide: RefreshSessionsRepository, useValue: refreshSessionsRepository },
        { provide: PasswordService, useValue: passwordService },
        { provide: TokenService, useValue: tokenService },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a user, stores credentials, and creates a refresh session', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    passwordService.hashPassword.mockResolvedValue('argon-hash');
    usersRepository.createAndSave.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    const result = await service.register(
      { email: 'john@example.com', fullName: 'John Doe', password: 'secret123' },
      { userAgent: 'jest', ipAddress: '127.0.0.1' },
    );

    expect(localCredentialsRepository.createAndSave).toHaveBeenCalledWith(
      'user-1',
      'argon-hash',
      {},
    );
    expect(outboxService.enqueue).toHaveBeenCalledTimes(1);
    expect(refreshSessionsRepository.createAndSave).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
    expect(result.user.email).toBe('john@example.com');
  });

  it('rejects duplicate registration', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 'user-1' });
    passwordService.hashPassword.mockResolvedValue('argon-hash');

    await expect(
      service.register(
        { email: 'john@example.com', fullName: 'John Doe', password: 'secret123' },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('logs a user in and creates a new refresh session', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });
    localCredentialsRepository.findByUserId.mockResolvedValue({
      userId: 'user-1',
      passwordHash: 'argon-hash',
    });
    passwordService.verifyPassword.mockResolvedValue(true);
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    const result = await service.login(
      { email: 'john@example.com', password: 'secret123' },
      { userAgent: 'jest' },
    );

    expect(passwordService.verifyPassword).toHaveBeenCalledWith('secret123', 'argon-hash');
    expect(refreshSessionsRepository.createAndSave).toHaveBeenCalledTimes(1);
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('refreshes tokens by rotating the session', async () => {
    tokenService.verifyRefreshToken.mockResolvedValue({
      sub: 'user-1',
      email: 'john@example.com',
      sessionId: 'session-1',
    });
    refreshSessionsRepository.findActiveById.mockResolvedValue({
      id: 'session-1',
      userId: 'user-1',
      tokenHash: 'refresh-token-hash',
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
      updatedAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    const result = await service.refresh('refresh-token', { ipAddress: '127.0.0.1' });

    expect(refreshSessionsRepository.revoke).toHaveBeenCalledWith('session-1', {});
    expect(refreshSessionsRepository.createAndSave).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
  });

  it('rejects invalid password on login', async () => {
    usersRepository.findByEmail.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      fullName: 'John Doe',
      isActive: true,
    });
    localCredentialsRepository.findByUserId.mockResolvedValue({
      userId: 'user-1',
      passwordHash: 'argon-hash',
    });
    passwordService.verifyPassword.mockResolvedValue(false);

    await expect(
      service.login({ email: 'john@example.com', password: 'wrongpass' }, {}),
    ).rejects.toThrow(UnauthorizedException);
  });
});
