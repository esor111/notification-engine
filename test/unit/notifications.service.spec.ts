import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { OutboxService } from '../../src/common/mq/outbox.service';
import { NotificationTemplatesService } from '../../src/modules/notification-templates/service/notification-templates.service';
import { NotificationDeliveriesRepository } from '../../src/modules/notifications/repository/notification-deliveries.repository';
import { NotificationLogsRepository } from '../../src/modules/notifications/repository/notification-logs.repository';
import { NotificationsRepository } from '../../src/modules/notifications/repository/notifications.repository';
import { NotificationsService } from '../../src/modules/notifications/service/notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  const dataSource = {
    transaction: jest.fn(),
  };
  const notificationsRepository = {
    findByDedupeKey: jest.fn(),
    createAndSave: jest.fn(),
    findByUserId: jest.fn(),
  };
  const templatesService = {
    getOrThrow: jest.fn(),
  };
  const notificationLogsRepository = {
    append: jest.fn(),
  };
  const notificationDeliveriesRepository = {
    findByNotificationId: jest.fn(),
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
        NotificationsService,
        { provide: DataSource, useValue: dataSource },
        { provide: NotificationsRepository, useValue: notificationsRepository },
        { provide: NotificationTemplatesService, useValue: templatesService },
        { provide: NotificationLogsRepository, useValue: notificationLogsRepository },
        { provide: NotificationDeliveriesRepository, useValue: notificationDeliveriesRepository },
        { provide: OutboxService, useValue: outboxService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('creates a notification and enqueues a dispatch event', async () => {
    notificationsRepository.findByDedupeKey.mockResolvedValue(null);
    templatesService.getOrThrow.mockResolvedValue({ id: 'template-1' });
    notificationsRepository.createAndSave.mockResolvedValue({
      id: 'notification-1',
      userId: 'user-1',
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: { orderId: 'A123' },
      status: 'pending',
      priority: 'normal',
      dedupeKey: 'order-1',
      scheduledAt: null,
      processedAt: null,
      createdAt: new Date('2026-03-07T00:00:00.000Z'),
    });

    const result = await service.create('user-1', {
      templateId: 'template-1',
      eventType: 'order_shipped',
      data: { orderId: 'A123' },
      dedupeKey: 'order-1',
    });

    expect(notificationLogsRepository.append).toHaveBeenCalledWith(
      'notification-1',
      'queued',
      { priority: 'normal' },
      {},
    );
    expect(outboxService.enqueue).toHaveBeenCalledTimes(1);
    expect(result.id).toBe('notification-1');
  });

  it('rejects duplicate dedupe keys', async () => {
    notificationsRepository.findByDedupeKey.mockResolvedValue({ id: 'notification-1' });

    await expect(
      service.create('user-1', {
        templateId: 'template-1',
        eventType: 'order_shipped',
        data: { orderId: 'A123' },
        dedupeKey: 'order-1',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
