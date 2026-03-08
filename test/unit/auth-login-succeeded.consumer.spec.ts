import { Test, TestingModule } from '@nestjs/testing';
import { ProcessedMessagesService } from '../../src/common/mq/processed-messages.service';
import { RabbitMqClient } from '../../src/common/mq/rabbitmq.client';
import { NotificationTemplatesService } from '../../src/modules/notification-templates/service/notification-templates.service';
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_TEMPLATE_NAMES,
} from '../../src/modules/notifications/notification-template-names';
import { NotificationsService } from '../../src/modules/notifications/service/notifications.service';
import { AuthLoginSucceededConsumer } from '../../src/modules/auth/consumer/auth-login-succeeded.consumer';

describe('AuthLoginSucceededConsumer', () => {
  let consumer: AuthLoginSucceededConsumer;

  const rabbitMqClient = {
    consume: jest.fn(),
  };

  const processedMessagesService = {
    processOnce: jest.fn(),
  };

  const notificationTemplatesService = {
    findEntityByName: jest.fn(),
  };

  const notificationsService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthLoginSucceededConsumer,
        { provide: RabbitMqClient, useValue: rabbitMqClient },
        { provide: ProcessedMessagesService, useValue: processedMessagesService },
        { provide: NotificationTemplatesService, useValue: notificationTemplatesService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    consumer = module.get<AuthLoginSucceededConsumer>(AuthLoginSucceededConsumer);
  });

  it('creates a security login notification when the template exists', async () => {
    notificationTemplatesService.findEntityByName.mockResolvedValue({
      id: 'template-security',
    });

    await consumer.handleLoginSucceeded({
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Demo User',
      userAgent: 'Chrome',
      ipAddress: '127.0.0.1',
      occurredAt: '2026-03-07T00:00:00.000Z',
    });

    expect(notificationTemplatesService.findEntityByName).toHaveBeenCalledWith(
      NOTIFICATION_TEMPLATE_NAMES.securityLoginPush,
    );
    expect(notificationsService.create).toHaveBeenCalledWith('user-1', {
      templateId: 'template-security',
      eventType: NOTIFICATION_EVENT_TYPES.securityAlerts,
      data: {
        email: 'user@example.com',
        fullName: 'Demo User',
        deviceName: 'Chrome',
        location: '127.0.0.1',
      },
      priority: 'critical',
      dedupeKey: 'auth.login.succeeded:user-1:2026-03-07T00:00:00.000Z',
    });
  });

  it('skips notification creation when the template is missing', async () => {
    notificationTemplatesService.findEntityByName.mockResolvedValue(null);

    await consumer.handleLoginSucceeded({
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Demo User',
      occurredAt: '2026-03-07T00:00:00.000Z',
    });

    expect(notificationsService.create).not.toHaveBeenCalled();
  });
});
