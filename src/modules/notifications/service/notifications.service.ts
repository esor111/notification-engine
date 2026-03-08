import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { mqConfig } from '../../../common/mq/mq.config';
import { OutboxService } from '../../../common/mq/outbox.service';
import { notificationCreated } from '../../../common/observability/metrics';
import { NotificationTemplatesService } from '../../notification-templates/service/notification-templates.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationDeliveryDto } from '../dto/notification-delivery.dto';
import { NotificationLogDto } from '../dto/notification-log.dto';
import { NotificationDto } from '../dto/notification.dto';
import { NotificationDeliveryEntity } from '../entity/notification-delivery.entity';
import { NotificationLogEntity } from '../entity/notification-log.entity';
import { NotificationEntity } from '../entity/notification.entity';
import { NotificationDeliveriesRepository } from '../repository/notification-deliveries.repository';
import { NotificationLogsRepository } from '../repository/notification-logs.repository';
import { NotificationsRepository } from '../repository/notifications.repository';

function toNotificationDto(entity: NotificationEntity): NotificationDto {
  return {
    id: entity.id,
    userId: entity.userId,
    templateId: entity.templateId,
    eventType: entity.eventType,
    data: entity.data,
    status: entity.status,
    priority: entity.priority,
    dedupeKey: entity.dedupeKey,
    scheduledAt: entity.scheduledAt ? entity.scheduledAt.toISOString() : null,
    processedAt: entity.processedAt ? entity.processedAt.toISOString() : null,
    createdAt: entity.createdAt.toISOString(),
  };
}

function toDeliveryDto(entity: NotificationDeliveryEntity): NotificationDeliveryDto {
  return {
    id: entity.id,
    notificationId: entity.notificationId,
    channel: entity.channel,
    provider: entity.provider,
    status: entity.status,
    retryCount: entity.retryCount,
    errorMessage: entity.errorMessage,
    providerMessageId: entity.providerMessageId,
    sentAt: entity.sentAt ? entity.sentAt.toISOString() : null,
    deliveredAt: entity.deliveredAt ? entity.deliveredAt.toISOString() : null,
  };
}

function toLogDto(entity: NotificationLogEntity): NotificationLogDto {
  return {
    id: entity.id,
    notificationId: entity.notificationId,
    event: entity.event,
    metadata: entity.metadata,
    timestamp: entity.timestamp.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationTemplatesService: NotificationTemplatesService,
    private readonly notificationLogsRepository: NotificationLogsRepository,
    private readonly notificationDeliveriesRepository: NotificationDeliveriesRepository,
    private readonly outboxService: OutboxService,
  ) {}

  async create(userId: string, dto: CreateNotificationDto): Promise<NotificationDto> {
    const existing = dto.dedupeKey
      ? await this.notificationsRepository.findByDedupeKey(dto.dedupeKey)
      : null;
    if (existing) {
      throw new ConflictException('A notification with this dedupe key already exists');
    }

    await this.notificationTemplatesService.getOrThrow(dto.templateId);

    const dedupeKey = dto.dedupeKey ?? `${dto.eventType}:${userId}:${Date.now()}`;

    const notification = await this.dataSource.transaction(async (manager) => {
      const createdNotification = await this.notificationsRepository.createAndSave(
        {
          userId,
          templateId: dto.templateId,
          eventType: dto.eventType,
          data: dto.data,
          status: 'pending',
          priority: dto.priority ?? 'normal',
          dedupeKey,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
          processedAt: null,
        },
        manager,
      );

      await this.notificationLogsRepository.append(
        createdNotification.id,
        'queued',
        { priority: createdNotification.priority },
        manager,
      );

      await this.outboxService.enqueue(
        {
          eventType: 'notification.created',
          aggregateType: 'notification',
          aggregateId: createdNotification.id,
          queue: mqConfig.notificationEventsQueue,
          dedupeKey: `notification.created:${createdNotification.id}`,
          payload: {
            notificationId: createdNotification.id,
            attempt: 1,
          },
        },
        manager,
      );

      // Record metric
      notificationCreated.inc({
        event_type: createdNotification.eventType,
        priority: createdNotification.priority,
      });

      return createdNotification;
    });

    return toNotificationDto(notification);
  }

  async listForUser(userId: string): Promise<NotificationDto[]> {
    const notifications = await this.notificationsRepository.findByUserId(userId);
    return notifications.map(toNotificationDto);
  }

  async getDeliveriesForUser(
    userId: string,
    notificationId: string,
  ): Promise<NotificationDeliveryDto[]> {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const deliveries =
      await this.notificationDeliveriesRepository.findByNotificationId(notificationId);
    return deliveries.map(toDeliveryDto);
  }

  async getLogsForUser(userId: string, notificationId: string): Promise<NotificationLogDto[]> {
    const notification = await this.notificationsRepository.findById(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    const logs = await this.notificationLogsRepository.findByNotificationId(notificationId);
    return logs.map(toLogDto);
  }
}
