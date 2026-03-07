import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationEntity } from '../entity/notification.entity';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<NotificationEntity> {
    return manager ? manager.getRepository(NotificationEntity) : this.repo;
  }

  async findById(id: string, manager?: EntityManager): Promise<NotificationEntity | null> {
    return this.getRepository(manager).findOne({ where: { id } });
  }

  async findByDedupeKey(
    dedupeKey: string,
    manager?: EntityManager,
  ): Promise<NotificationEntity | null> {
    return this.getRepository(manager).findOne({ where: { dedupeKey } });
  }

  async findAll(): Promise<NotificationEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async createAndSave(
    data: {
      userId: string;
      templateId: string;
      eventType: string;
      data: Record<string, unknown>;
      status: NotificationEntity['status'];
      priority: NotificationEntity['priority'];
      dedupeKey: string;
      scheduledAt: Date | null;
      processedAt: Date | null;
    },
    manager?: EntityManager,
  ): Promise<NotificationEntity> {
    const repository = this.getRepository(manager);
    const entity = repository.create(data);
    return repository.save(entity);
  }

  async updateStatus(
    id: string,
    status: NotificationEntity['status'],
    processedAt?: Date | null,
    manager?: EntityManager,
  ): Promise<void> {
    await this.getRepository(manager).update(
      { id },
      {
        status,
        processedAt: processedAt === undefined ? null : processedAt,
      },
    );
  }
}
