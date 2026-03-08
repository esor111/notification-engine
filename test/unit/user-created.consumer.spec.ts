import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesService } from '../../src/modules/notification-templates/service/notification-templates.service';
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_TEMPLATE_NAMES,
} from '../../src/modules/notifications/notification-template-names';
import { NotificationsService } from '../../src/modules/notifications/service/notifications.service';
import { UserCreatedConsumer } from '../../src/modules/users/consumer/user-created.consumer';
import { ProcessedMessagesService } from '../../src/common/mq/processed-messages.service';
import { RabbitMqClient } from '../../src/common/mq/rabbitmq.client';

describe('UserCreatedConsumer', () => {
  let consumer: UserCreatedConsumer;

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
        UserCreatedConsumer,
        { provide: RabbitMqClient, useValue: rabbitMqClient },
        { provide: ProcessedMessagesService, useValue: processedMessagesService },
        { provide: NotificationTemplatesService, useValue: notificationTemplatesService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    consumer = module.get<UserCreatedConsumer>(UserCreatedConsumer);
  });

  it('creates a welcome notification when the template exists', async () => {
    notificationTemplatesService.findEntityByName.mockResolvedValue({
      id: 'template-1',
    });

    await consumer.handleUserCreated({
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Demo User',
      occurredAt: '2026-03-07T00:00:00.000Z',
    });

    expect(notificationTemplatesService.findEntityByName).toHaveBeenCalledWith(
      NOTIFICATION_TEMPLATE_NAMES.userWelcomeEmail,
    );
    expect(notificationsService.create).toHaveBeenCalledWith('user-1', {
      templateId: 'template-1',
      eventType: NOTIFICATION_EVENT_TYPES.accountUpdates,
      data: {
        email: 'user@example.com',
        fullName: 'Demo User',
      },
      priority: 'normal',
      dedupeKey: 'user.created:user-1:welcome',
    });
  });

  it('skips notification creation when the template is missing', async () => {
    notificationTemplatesService.findEntityByName.mockResolvedValue(null);

    await consumer.handleUserCreated({
      userId: 'user-1',
      email: 'user@example.com',
      fullName: 'Demo User',
      occurredAt: '2026-03-07T00:00:00.000Z',
    });

    expect(notificationsService.create).not.toHaveBeenCalled();
  });
});
