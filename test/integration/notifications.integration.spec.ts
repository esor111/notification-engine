import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NotificationTemplatesService } from '../../src/modules/notification-templates/service/notification-templates.service';
import { NotificationTemplatesRepository } from '../../src/modules/notification-templates/repository/notification-templates.repository';
import { NotificationTemplateEntity } from '../../src/modules/notification-templates/entity/notification-template.entity';
import { NotificationLogsRepository } from '../../src/modules/notifications/repository/notification-logs.repository';
import { NotificationDeliveriesRepository } from '../../src/modules/notifications/repository/notification-deliveries.repository';
import { NotificationsRepository } from '../../src/modules/notifications/repository/notifications.repository';
import { NotificationsService } from '../../src/modules/notifications/service/notifications.service';
import { NotificationDeliveryEntity } from '../../src/modules/notifications/entity/notification-delivery.entity';
import { UsersRepository } from '../../src/modules/users/repository/users.repository';
import { UserEntity } from '../../src/modules/users/entity/user.entity';
import { AuditService } from '../../src/common/audit/audit.service';
import { OutboxEventEntity } from '../../src/common/mq/entities/outbox-event.entity';
import { OutboxService } from '../../src/common/mq/outbox.service';
import { NotificationLogEntity } from '../../src/modules/notifications/entity/notification-log.entity';
import { NotificationEntity } from '../../src/modules/notifications/entity/notification.entity';
import { createPostgresTestHarness } from '../support/postgres-test-datasource';

describe('Notifications integration', () => {
  let dataSource: DataSource;
  let destroyHarness: () => Promise<void>;
  let usersRepository: UsersRepository;
  let notificationsRepository: NotificationsRepository;
  let notificationLogsRepository: NotificationLogsRepository;
  let notificationsService: NotificationsService;
  let templatesService: NotificationTemplatesService;

  beforeAll(async () => {
    const harness = await createPostgresTestHarness();
    dataSource = harness.dataSource;
    destroyHarness = harness.destroy;

    usersRepository = new UsersRepository(dataSource.getRepository(UserEntity));
    const templatesRepository = new NotificationTemplatesRepository(
      dataSource.getRepository(NotificationTemplateEntity),
    );
    notificationsRepository = new NotificationsRepository(
      dataSource.getRepository(NotificationEntity),
    );
    const notificationDeliveriesRepository = new NotificationDeliveriesRepository(
      dataSource.getRepository(NotificationDeliveryEntity),
    );
    notificationLogsRepository = new NotificationLogsRepository(
      dataSource.getRepository(NotificationLogEntity),
    );
    const outboxService = new OutboxService(dataSource.getRepository(OutboxEventEntity));
    const auditService = new AuditService(dataSource);

    templatesService = new NotificationTemplatesService(
      dataSource,
      templatesRepository,
      auditService,
    );
    notificationsService = new NotificationsService(
      dataSource,
      notificationsRepository,
      templatesService,
      notificationLogsRepository,
      notificationDeliveriesRepository,
      outboxService,
    );
  });

  afterAll(async () => {
    if (destroyHarness) {
      await destroyHarness();
    }
  });

  it('persists a queued notification with lifecycle log and outbox event', async () => {
    const user = await usersRepository.createAndSave({
      email: 'notification.integration@example.com',
      fullName: 'Integration Test User',
    });
    const template = await templatesService.create({
      name: 'order-shipped-email',
      channel: 'email',
      titleTemplate: 'Order {{orderId}} shipped',
      bodyTemplate: 'Order {{orderId}} has shipped.',
      variablesSchema: { orderId: { type: 'string' } },
    });

    const created = await notificationsService.create(user.id, {
      templateId: template.id,
      eventType: 'order_updates',
      data: { orderId: 'A123' },
      priority: 'normal',
      dedupeKey: 'order:A123:shipped',
    });

    expect(created.userId).toBe(user.id);
    expect(created.templateId).toBe(template.id);
    expect(created.status).toBe('pending');

    const stored = await notificationsRepository.findByDedupeKey('order:A123:shipped');
    expect(stored).not.toBeNull();

    const logs = await notificationLogsRepository.findByNotificationId(stored!.id);
    expect(logs).toHaveLength(1);
    const firstLog = logs[0]!;
    expect(firstLog.event).toBe('queued');
    expect(firstLog.metadata).toEqual({ priority: 'normal' });

    const outboxEvents = await dataSource.getRepository(OutboxEventEntity).find({
      where: { aggregateId: stored!.id },
    });
    expect(outboxEvents).toHaveLength(1);
    const outboxEvent = outboxEvents[0]!;
    expect(outboxEvent.eventType).toBe('notification.created');
    expect(outboxEvent.status).toBe('pending');
    expect(outboxEvent.payload).toEqual({ notificationId: stored!.id, attempt: 1 });

    const lifecycle = await notificationsService.getLogsForUser(user.id, stored!.id);
    expect(lifecycle).toHaveLength(1);
    const lifecycleLog = lifecycle[0]!;
    expect(lifecycleLog.event).toBe('queued');
  });

  it('rejects duplicate notification dedupe keys', async () => {
    const user = await usersRepository.createAndSave({
      email: 'notification.duplicate@example.com',
      fullName: 'Duplicate Test User',
    });
    const template = await templatesService.create({
      name: 'device-alert-email',
      channel: 'email',
      titleTemplate: 'Device alert',
      bodyTemplate: 'Device alert for {{deviceId}}.',
    });

    await notificationsService.create(user.id, {
      templateId: template.id,
      eventType: 'device_alerts',
      data: { deviceId: 'device-42' },
      dedupeKey: 'device-alert:42',
    });

    await expect(
      notificationsService.create(user.id, {
        templateId: template.id,
        eventType: 'device_alerts',
        data: { deviceId: 'device-42' },
        dedupeKey: 'device-alert:42',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('stores notification logs in chronological order', async () => {
    const user = await usersRepository.createAndSave({
      email: 'notification.logs@example.com',
      fullName: 'Logs Test User',
    });
    const template = await templatesService.create({
      name: 'push-order-ready',
      channel: 'push',
      titleTemplate: 'Order ready',
      bodyTemplate: 'Order {{orderId}} is ready.',
    });
    const created = await notificationsService.create(user.id, {
      templateId: template.id,
      eventType: 'order_updates',
      data: { orderId: 'B456' },
      dedupeKey: 'order:B456:ready',
    });

    await dataSource.getRepository(NotificationLogEntity).save(
      dataSource.getRepository(NotificationLogEntity).create({
        notificationId: created.id,
        event: 'retry_scheduled',
        metadata: { attempt: 2 },
      }),
    );

    const logs = await notificationsService.getLogsForUser(user.id, created.id);
    expect(logs.map((log) => log.event)).toEqual(['queued', 'retry_scheduled']);
  });
});
