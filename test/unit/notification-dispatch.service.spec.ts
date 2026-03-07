import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { appConfig } from '../../src/common/config/configuration';
import { OutboxService } from '../../src/common/mq/outbox.service';
import { DeviceTokensRepository } from '../../src/modules/device-tokens/repository/device-tokens.repository';
import { NotificationTemplatesRepository } from '../../src/modules/notification-templates/repository/notification-templates.repository';
import { NotificationPreferencesRepository } from '../../src/modules/notification-preferences/repository/notification-preferences.repository';
import { EmailNotificationProvider } from '../../src/modules/providers/email/email-notification.provider';
import { PushNotificationProvider } from '../../src/modules/providers/push/push-notification.provider';
import { NotificationDeliveriesRepository } from '../../src/modules/notifications/repository/notification-deliveries.repository';
import { NotificationLogsRepository } from '../../src/modules/notifications/repository/notification-logs.repository';
import { NotificationsRepository } from '../../src/modules/notifications/repository/notifications.repository';
import { NotificationDispatchService } from '../../src/modules/notifications/service/notification-dispatch.service';
import { NotificationRendererService } from '../../src/modules/notifications/service/notification-renderer.service';
import { UsersRepository } from '../../src/modules/users/repository/users.repository';

describe('NotificationDispatchService', () => {
  let service: NotificationDispatchService;
  const dataSource = {
    transaction: jest.fn(),
  };
  const notificationsRepository = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };
  const templatesRepository = {
    findById: jest.fn(),
  };
  const deliveriesRepository = {
    createAndSave: jest.fn(),
  };
  const preferencesRepository = {
    findOne: jest.fn(),
  };
  const logsRepository = {
    append: jest.fn(),
  };
  const deviceTokensRepository = {
    findActiveByUserId: jest.fn(),
    markUsed: jest.fn(),
  };
  const usersRepository = {
    findById: jest.fn(),
  };
  const emailProvider = {
    send: jest.fn(),
  };
  const pushProvider = {
    send: jest.fn(),
  };
  const outboxService = {
    enqueue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    dataSource.transaction.mockImplementation(
      async (callback: (manager: object) => Promise<unknown>) => callback({}),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationDispatchService,
        NotificationRendererService,
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsRepository, useValue: notificationsRepository },
        { provide: NotificationTemplatesRepository, useValue: templatesRepository },
        { provide: NotificationDeliveriesRepository, useValue: deliveriesRepository },
        { provide: NotificationPreferencesRepository, useValue: preferencesRepository },
        { provide: NotificationLogsRepository, useValue: logsRepository },
        { provide: DeviceTokensRepository, useValue: deviceTokensRepository },
        { provide: UsersRepository, useValue: usersRepository },
        { provide: EmailNotificationProvider, useValue: emailProvider },
        { provide: PushNotificationProvider, useValue: pushProvider },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get<NotificationDispatchService>(NotificationDispatchService);
  });

  it('sends an email notification successfully', async () => {
    notificationsRepository.findById.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: { order_id: 'A123' },
    });
    templatesRepository.findById.mockResolvedValue({
      id: 'template-1',
      channel: 'email',
      titleTemplate: 'Order {{order_id}} shipped',
      bodyTemplate: 'Order {{order_id}} is on the way',
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      isActive: true,
    });
    preferencesRepository.findOne.mockResolvedValue(null);
    emailProvider.send.mockResolvedValue({ provider: 'console-email', providerMessageId: 'msg-1' });

    await service.dispatch({ notificationId: 'notification-1', attempt: 1 });

    expect(emailProvider.send).toHaveBeenCalledWith({
      to: 'john@example.com',
      subject: 'Order A123 shipped',
      body: 'Order A123 is on the way',
    });
    expect(deliveriesRepository.createAndSave).toHaveBeenCalled();
    expect(notificationsRepository.updateStatus).toHaveBeenCalledWith(
      'notification-1',
      'sent',
      expect.any(Date),
      {},
    );
  });

  it('skips a notification when user preference disables the channel', async () => {
    notificationsRepository.findById.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: {},
    });
    templatesRepository.findById.mockResolvedValue({
      id: 'template-1',
      channel: 'email',
      titleTemplate: 'Title',
      bodyTemplate: 'Body',
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      isActive: true,
    });
    preferencesRepository.findOne.mockResolvedValue({ enabled: false });

    await service.dispatch({ notificationId: 'notification-1', attempt: 1 });

    expect(deliveriesRepository.createAndSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'skipped', provider: 'preference-filter' }),
      {},
    );
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('schedules a retry when delivery fails before max retries', async () => {
    notificationsRepository.findById.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: {},
    });
    templatesRepository.findById.mockResolvedValue({
      id: 'template-1',
      channel: 'email',
      titleTemplate: 'Title',
      bodyTemplate: 'Body',
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      isActive: true,
    });
    preferencesRepository.findOne.mockResolvedValue(null);
    emailProvider.send.mockRejectedValue(new Error('Provider unavailable'));

    await service.dispatch({ notificationId: 'notification-1', attempt: 1 });

    expect(outboxService.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'notification.retry',
        dedupeKey: 'notification.retry:notification-1:2',
        payload: { notificationId: 'notification-1', attempt: 2 },
      }),
      {},
    );
  });

  it('dead-letters after max retries', async () => {
    notificationsRepository.findById.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: {},
    });
    templatesRepository.findById.mockResolvedValue({
      id: 'template-1',
      channel: 'email',
      titleTemplate: 'Title',
      bodyTemplate: 'Body',
    });
    usersRepository.findById.mockResolvedValue({
      id: 'user-1',
      email: 'john@example.com',
      isActive: true,
    });
    preferencesRepository.findOne.mockResolvedValue(null);
    emailProvider.send.mockRejectedValue(new Error('Provider unavailable'));

    await service.dispatch({
      notificationId: 'notification-1',
      attempt: appConfig.notifications.maxDeliveryRetries,
    });

    expect(notificationsRepository.updateStatus).toHaveBeenCalledWith(
      'notification-1',
      'dead_lettered',
      null,
      {},
    );
    expect(outboxService.enqueue).not.toHaveBeenCalled();
  });
});
