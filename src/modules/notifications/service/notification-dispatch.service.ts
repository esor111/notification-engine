import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { appConfig } from '../../../common/config/configuration';
import { mqConfig } from '../../../common/mq/mq.config';
import { OutboxService } from '../../../common/mq/outbox.service';
import { UsersRepository } from '../../users/repository/users.repository';
import { DeviceTokensRepository } from '../../device-tokens/repository/device-tokens.repository';
import { NotificationTemplatesRepository } from '../../notification-templates/repository/notification-templates.repository';
import { NotificationPreferencesRepository } from '../../notification-preferences/repository/notification-preferences.repository';
import { EmailNotificationProvider } from '../../providers/email/email-notification.provider';
import { PushNotificationProvider } from '../../providers/push/push-notification.provider';
import { NotificationDeliveriesRepository } from '../repository/notification-deliveries.repository';
import { NotificationLogsRepository } from '../repository/notification-logs.repository';
import { NotificationsRepository } from '../repository/notifications.repository';
import { NotificationRendererService } from './notification-renderer.service';

type DispatchPayload = {
  notificationId: string;
  attempt?: number;
};

@Injectable()
export class NotificationDispatchService {
  private readonly logger = new Logger(NotificationDispatchService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationTemplatesRepository: NotificationTemplatesRepository,
    private readonly notificationDeliveriesRepository: NotificationDeliveriesRepository,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
    private readonly notificationLogsRepository: NotificationLogsRepository,
    private readonly deviceTokensRepository: DeviceTokensRepository,
    private readonly usersRepository: UsersRepository,
    private readonly notificationRendererService: NotificationRendererService,
    private readonly emailNotificationProvider: EmailNotificationProvider,
    private readonly pushNotificationProvider: PushNotificationProvider,
    private readonly outboxService: OutboxService,
  ) {}

  async dispatch(payload: DispatchPayload): Promise<void> {
    const attempt = payload.attempt ?? 1;
    const notification = await this.notificationsRepository.findById(payload.notificationId);
    if (!notification) {
      this.logger.warn(`Notification ${payload.notificationId} not found`);
      return;
    }

    const template = await this.notificationTemplatesRepository.findById(notification.templateId);
    if (!template) {
      await this.failNotification(notification.id, attempt, 'Notification template not found');
      return;
    }

    const user = await this.usersRepository.findById(notification.userId);
    if (!user || !user.isActive) {
      await this.failNotification(notification.id, attempt, 'Notification user is not active');
      return;
    }

    const preference = await this.notificationPreferencesRepository.findOne(
      notification.userId,
      notification.eventType,
      template.channel,
    );
    if (preference && !preference.enabled) {
      await this.skipNotification(
        notification.id,
        template.channel,
        attempt,
        'User preference disabled',
      );
      return;
    }

    try {
      const renderedTitle = this.notificationRendererService.render(
        template.titleTemplate,
        notification.data,
      );
      const renderedBody = this.notificationRendererService.render(
        template.bodyTemplate,
        notification.data,
      );
      const providerResult = await this.sendThroughProvider(
        template.channel,
        user.email,
        notification.data,
        renderedTitle,
        renderedBody,
        notification.userId,
      );

      await this.dataSource.transaction(async (manager) => {
        await this.notificationDeliveriesRepository.createAndSave(
          {
            notificationId: notification.id,
            channel: template.channel,
            provider: providerResult.provider,
            status: 'sent',
            retryCount: attempt - 1,
            errorMessage: null,
            providerMessageId: providerResult.providerMessageId,
            sentAt: new Date(),
            deliveredAt: null,
            lastAttemptAt: new Date(),
          },
          manager,
        );
        await this.notificationsRepository.updateStatus(
          notification.id,
          'sent',
          new Date(),
          manager,
        );
        await this.notificationLogsRepository.append(
          notification.id,
          'sent',
          {
            channel: template.channel,
            provider: providerResult.provider,
            attempt,
          },
          manager,
        );
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown notification delivery error';
      await this.failNotification(notification.id, attempt, message, template.channel);
    }
  }

  private async sendThroughProvider(
    channel: string,
    email: string,
    data: Record<string, unknown>,
    title: string,
    body: string,
    userId: string,
  ): Promise<{ provider: string; providerMessageId: string }> {
    if (channel === 'email') {
      return this.emailNotificationProvider.send({
        to: email,
        subject: title,
        body,
      });
    }

    if (channel === 'push') {
      const tokens = await this.deviceTokensRepository.findActiveByUserId(userId);
      if (tokens.length === 0) {
        throw new Error('No active device tokens available for push delivery');
      }

      const result = await this.pushNotificationProvider.send({
        tokens: tokens.map((token) => token.token),
        title,
        body,
        data,
      });
      await this.deviceTokensRepository.markUsed(tokens.map((token) => token.token));
      return result;
    }

    throw new Error(`Unsupported notification channel: ${channel}`);
  }

  private async skipNotification(
    notificationId: string,
    channel: string,
    attempt: number,
    reason: string,
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.notificationDeliveriesRepository.createAndSave(
        {
          notificationId,
          channel,
          provider: 'preference-filter',
          status: 'skipped',
          retryCount: attempt - 1,
          errorMessage: reason,
          providerMessageId: null,
          sentAt: null,
          deliveredAt: null,
          lastAttemptAt: new Date(),
        },
        manager,
      );
      await this.notificationsRepository.updateStatus(
        notificationId,
        'skipped',
        new Date(),
        manager,
      );
      await this.notificationLogsRepository.append(
        notificationId,
        'skipped',
        { reason, attempt, channel },
        manager,
      );
    });
  }

  private async failNotification(
    notificationId: string,
    attempt: number,
    errorMessage: string,
    channel = 'unknown',
  ): Promise<void> {
    const willRetry = attempt < appConfig.notifications.maxDeliveryRetries;
    const nextStatus = willRetry ? 'retrying' : 'dead_lettered';

    await this.dataSource.transaction(async (manager) => {
      await this.notificationDeliveriesRepository.createAndSave(
        {
          notificationId,
          channel,
          provider: 'dispatch-worker',
          status: willRetry ? 'failed' : 'dead_lettered',
          retryCount: attempt,
          errorMessage,
          providerMessageId: null,
          sentAt: null,
          deliveredAt: null,
          lastAttemptAt: new Date(),
        },
        manager,
      );
      await this.notificationsRepository.updateStatus(notificationId, nextStatus, null, manager);
      await this.notificationLogsRepository.append(
        notificationId,
        willRetry ? 'retry_scheduled' : 'dead_lettered',
        { errorMessage, attempt, channel },
        manager,
      );

      if (willRetry) {
        await this.outboxService.enqueue(
          {
            eventType: 'notification.retry',
            aggregateType: 'notification',
            aggregateId: notificationId,
            queue: mqConfig.notificationEventsQueue,
            dedupeKey: `notification.retry:${notificationId}:${attempt + 1}`,
            payload: {
              notificationId,
              attempt: attempt + 1,
            },
          },
          manager,
        );
      }
    });
  }
}
