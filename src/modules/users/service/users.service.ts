import { ConflictException, Injectable } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { mqConfig } from '../../../common/mq/mq.config';
import { OutboxService } from '../../../common/mq/outbox.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserDto, toUserDto } from '../dto/user.dto';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersRepository: UsersRepository,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorUserId?: string): Promise<UserDto> {
    try {
      const user = await this.dataSource.transaction(async (manager) => {
        const existingUser = await this.usersRepository.findByEmail(dto.email, manager);
        if (existingUser) {
          throw new ConflictException('A user with this email already exists');
        }

        const createdUser = await this.usersRepository.createAndSave(dto, manager);
        await this.outboxService.enqueue(
          {
            eventType: 'user.created',
            aggregateType: 'user',
            aggregateId: createdUser.id,
            queue: mqConfig.userCreatedQueue,
            dedupeKey: `user.created:${createdUser.id}`,
            payload: {
              userId: createdUser.id,
              email: createdUser.email,
              fullName: createdUser.fullName,
              occurredAt: new Date().toISOString(),
            },
          },
          manager,
        );

        await this.auditService.log(
          {
            actorUserId,
            action: 'user.created',
            resourceType: 'user',
            resourceId: createdUser.id,
            metadata: {
              email: createdUser.email,
              fullName: createdUser.fullName,
              role: createdUser.role,
            },
          },
          manager,
        );

        return createdUser;
      });

      return toUserDto(user);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        throw new ConflictException('A user with this email already exists');
      }

      throw error;
    }
  }

  async list(): Promise<UserDto[]> {
    const users = await this.usersRepository.findAll();
    return users.map(toUserDto);
  }
}
