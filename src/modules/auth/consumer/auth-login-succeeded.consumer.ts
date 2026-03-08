import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { appConfig } from '../../../common/config/configuration';
import { mqConfig } from '../../../common/mq/mq.config';
import { ProcessedMessagesService } from '../../../common/mq/processed-messages.service';
import { RabbitMqClient } from '../../../common/mq/rabbitmq.client';
import { NotificationTemplatesService } from '../../notification-templates/service/notification-templates.service';
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_TEMPLATE_NAMES,
} from '../../notifications/notification-template-names';
import { NotificationsService } from '../../notifications/service/notifications.service';

type AuthLoginSucceededPayload = {
  userId: string;
  email: string;
  fullName: string;
  userAgent?: string;
  ipAddress?: string;
  occurredAt: string;
};

@Injectable()
export class AuthLoginSucceededConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthLoginSucceededConsumer.name);
  private readonly consumerName = 'auth-login-succeeded-notification-consumer';

  constructor(
    private readonly rabbitMqClient: RabbitMqClient,
    private readonly processedMessagesService: ProcessedMessagesService,
    private readonly notificationTemplatesService: NotificationTemplatesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onApplicationBootstrap(): void {
    if (appConfig.nodeEnv === 'test') {
      return;
    }

    void this.rabbitMqClient.consume(mqConfig.authEventsQueue, async (message) => {
      const messageId = message.messageId || `missing:${message.eventType}`;
      await this.processedMessagesService.processOnce(this.consumerName, messageId, async () => {
        const payload = message.payload as unknown as AuthLoginSucceededPayload;
        await this.handleLoginSucceeded(payload);
      });
    });
  }

  async handleLoginSucceeded(payload: AuthLoginSucceededPayload): Promise<void> {
    const template = await this.notificationTemplatesService.findEntityByName(
      NOTIFICATION_TEMPLATE_NAMES.securityLoginPush,
    );

    if (!template) {
      this.logger.warn(
        `Skipping security login notification for user=${payload.userId}; template ${NOTIFICATION_TEMPLATE_NAMES.securityLoginPush} is missing`,
      );
      return;
    }

    await this.notificationsService.create(payload.userId, {
      templateId: template.id,
      eventType: NOTIFICATION_EVENT_TYPES.securityAlerts,
      data: {
        email: payload.email,
        fullName: payload.fullName,
        deviceName: payload.userAgent ?? 'Unknown device',
        location: payload.ipAddress ?? 'Unknown location',
      },
      priority: 'critical',
      dedupeKey: `auth.login.succeeded:${payload.userId}:${payload.occurredAt}`,
    });

    this.logger.log(`Created security login notification for user=${payload.userId}`);
  }
}
