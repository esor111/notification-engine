import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationDeliveryEntity } from '../entity/notification-delivery.entity';

@Injectable()
export class NotificationDeliveriesRepository {
  constructor(
    @InjectRepository(NotificationDeliveryEntity)
    private readonly repo: Repository<NotificationDeliveryEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<NotificationDeliveryEntity> {
    return manager ? manager.getRepository(NotificationDeliveryEntity) : this.repo;
  }

  async findByNotificationId(notificationId: string): Promise<NotificationDeliveryEntity[]> {
    return this.repo.find({ where: { notificationId }, order: { createdAt: 'ASC' } });
  }

  async findLatestByNotificationId(
    notificationId: string,
    manager?: EntityManager,
  ): Promise<NotificationDeliveryEntity | null> {
    return this.getRepository(manager).findOne({
      where: { notificationId },
      order: { createdAt: 'DESC' },
    });
  }

  async createAndSave(
    data: {
      notificationId: string;
      channel: string;
      provider: string;
      status: NotificationDeliveryEntity['status'];
      retryCount: number;
      errorMessage: string | null;
      providerMessageId: string | null;
      sentAt: Date | null;
      deliveredAt: Date | null;
      lastAttemptAt: Date | null;
    },
    manager?: EntityManager,
  ): Promise<NotificationDeliveryEntity> {
    const repository = this.getRepository(manager);
    const entity = repository.create(data);
    return repository.save(entity);
  }
}
