import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEventEntity } from '../../../common/mq/entities/outbox-event.entity';
import { DeadLetteredNotificationDto } from '../dto/dead-lettered-notification.dto';
import { ListOutboxEventsQueryDto } from '../dto/list-outbox-events-query.dto';
import { NotificationOutboxEventDto } from '../dto/notification-outbox-event.dto';
import { NotificationEntity } from '../entity/notification.entity';
import { NotificationDeliveriesRepository } from '../repository/notification-deliveries.repository';

function toOutboxDto(entity: OutboxEventEntity): NotificationOutboxEventDto {
  return {
    id: entity.id,
    eventType: entity.eventType,
    aggregateType: entity.aggregateType,
    aggregateId: entity.aggregateId,
    queue: entity.queue,
    status: entity.status,
    attempts: entity.attempts,
    lastError: entity.lastError,
    occurredAt: entity.occurredAt.toISOString(),
    availableAt: entity.availableAt.toISOString(),
    dispatchedAt: entity.dispatchedAt ? entity.dispatchedAt.toISOString() : null,
  };
}

@Injectable()
export class NotificationOperationsService {
  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
    private readonly notificationDeliveriesRepository: NotificationDeliveriesRepository,
  ) {}

  async listOutboxEvents(query: ListOutboxEventsQueryDto): Promise<NotificationOutboxEventDto[]> {
    const events = await this.outboxRepository.find({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.queue ? { queue: query.queue } : {}),
      },
      order: { occurredAt: 'DESC' },
      take: query.limit ?? 50,
    });

    return events.map(toOutboxDto);
  }

  async listDeadLetteredNotifications(limit = 50): Promise<DeadLetteredNotificationDto[]> {
    const notifications = await this.notificationsRepository.find({
      where: { status: 'dead_lettered' },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    const results: DeadLetteredNotificationDto[] = [];
    for (const notification of notifications) {
      const latestDelivery = await this.notificationDeliveriesRepository.findLatestByNotificationId(
        notification.id,
      );

      results.push({
        id: notification.id,
        userId: notification.userId,
        templateId: notification.templateId,
        eventType: notification.eventType,
        priority: notification.priority,
        dedupeKey: notification.dedupeKey,
        data: notification.data,
        channel: latestDelivery?.channel ?? null,
        provider: latestDelivery?.provider ?? null,
        lastError: latestDelivery?.errorMessage ?? null,
        lastAttemptAt: latestDelivery?.lastAttemptAt
          ? latestDelivery.lastAttemptAt.toISOString()
          : null,
        createdAt: notification.createdAt.toISOString(),
      });
    }

    return results;
  }
}
