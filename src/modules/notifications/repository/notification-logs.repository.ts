import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationLogEntity } from '../entity/notification-log.entity';

@Injectable()
export class NotificationLogsRepository {
  constructor(
    @InjectRepository(NotificationLogEntity)
    private readonly repo: Repository<NotificationLogEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<NotificationLogEntity> {
    return manager ? manager.getRepository(NotificationLogEntity) : this.repo;
  }

  async findByNotificationId(notificationId: string): Promise<NotificationLogEntity[]> {
    return this.repo.find({ where: { notificationId }, order: { timestamp: 'ASC' } });
  }

  async append(
    notificationId: string,
    event: string,
    metadata: Record<string, unknown> | null,
    manager?: EntityManager,
  ): Promise<NotificationLogEntity> {
    const repository = this.getRepository(manager);
    const entity = repository.create({ notificationId, event, metadata });
    return repository.save(entity);
  }
}
