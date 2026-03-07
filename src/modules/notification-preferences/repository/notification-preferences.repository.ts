import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { UserNotificationPreferenceEntity } from '../entity/user-notification-preference.entity';

@Injectable()
export class NotificationPreferencesRepository {
  constructor(
    @InjectRepository(UserNotificationPreferenceEntity)
    private readonly repo: Repository<UserNotificationPreferenceEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<UserNotificationPreferenceEntity> {
    return manager ? manager.getRepository(UserNotificationPreferenceEntity) : this.repo;
  }

  async findByUserId(userId: string): Promise<UserNotificationPreferenceEntity[]> {
    return this.repo.find({ where: { userId }, order: { notificationType: 'ASC' } });
  }

  async findOne(
    userId: string,
    notificationType: string,
    channel: string,
    manager?: EntityManager,
  ): Promise<UserNotificationPreferenceEntity | null> {
    return this.getRepository(manager).findOne({
      where: { userId, notificationType, channel },
    });
  }

  async upsert(
    data: {
      userId: string;
      notificationType: string;
      channel: string;
      enabled: boolean;
    },
    manager?: EntityManager,
  ): Promise<UserNotificationPreferenceEntity> {
    const repository = this.getRepository(manager);
    const existing = await repository.findOne({
      where: {
        userId: data.userId,
        notificationType: data.notificationType,
        channel: data.channel,
      },
    });

    if (existing) {
      existing.enabled = data.enabled;
      return repository.save(existing);
    }

    const entity = repository.create(data);
    return repository.save(entity);
  }
}
