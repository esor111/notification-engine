import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AuditService } from '../../src/common/audit/audit.service';
import { OutboxService } from '../../src/common/mq/outbox.service';
import { UsersRepository } from '../../src/modules/users/repository/users.repository';
import { UsersService } from '../../src/modules/users/service/users.service';

describe('UsersService', () => {
  let service: UsersService;
  const usersRepository = {
    findByEmail: jest.fn(),
    findAll: jest.fn(),
    createAndSave: jest.fn(),
  };
  const outboxService = {
    enqueue: jest.fn(),
  };
  const auditService = {
    log: jest.fn(),
  };
  const dataSource = {
    transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(
      async (callback: (manager: object) => Promise<unknown>) => callback({}),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DataSource, useValue: dataSource },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: OutboxService, useValue: outboxService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('creates a user and enqueues user.created event in the outbox', async () => {
    usersRepository.findByEmail.mockResolvedValue(null);
    usersRepository.createAndSave.mockResolvedValue({
      id: '9dc56a2a-9f53-4a3c-b9b0-0ae0f0786a40',
      email: 'john@example.com',
      fullName: 'John Doe',
      role: 'user',
      createdAt: new Date('2026-03-06T00:00:00.000Z'),
      updatedAt: new Date('2026-03-06T00:00:00.000Z'),
    });

    const result = await service.create({ email: 'john@example.com', fullName: 'John Doe' });

    expect(result.email).toBe('john@example.com');
    expect(outboxService.enqueue).toHaveBeenCalledTimes(1);
    expect(auditService.log).toHaveBeenCalledTimes(1);
  });

  it('throws conflict when email already exists', async () => {
    usersRepository.findByEmail.mockResolvedValue({ id: 'existing-id' });

    await expect(
      service.create({ email: 'john@example.com', fullName: 'John Doe' }),
    ).rejects.toThrow(ConflictException);
    expect(usersRepository.createAndSave).not.toHaveBeenCalled();
  });
});
