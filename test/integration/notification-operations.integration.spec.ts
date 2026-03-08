import { DataSource } from 'typeorm';
import { OutboxEventEntity } from '../../src/common/mq/entities/outbox-event.entity';
import { NotificationTemplateEntity } from '../../src/modules/notification-templates/entity/notification-template.entity';
import { NotificationDeliveryEntity } from '../../src/modules/notifications/entity/notification-delivery.entity';
import { NotificationEntity } from '../../src/modules/notifications/entity/notification.entity';
import { NotificationDeliveriesRepository } from '../../src/modules/notifications/repository/notification-deliveries.repository';
import { NotificationOperationsService } from '../../src/modules/notifications/service/notification-operations.service';
import { UserEntity } from '../../src/modules/users/entity/user.entity';
import { createPostgresTestHarness } from '../support/postgres-test-datasource';

describe('Notification operations integration', () => {
  let dataSource: DataSource;
  let destroyHarness: () => Promise<void>;
  let service: NotificationOperationsService;

  beforeAll(async () => {
    const harness = await createPostgresTestHarness();
    dataSource = harness.dataSource;
    destroyHarness = harness.destroy;

    service = new NotificationOperationsService(
      dataSource.getRepository(OutboxEventEntity),
      dataSource.getRepository(NotificationEntity),
      new NotificationDeliveriesRepository(dataSource.getRepository(NotificationDeliveryEntity)),
    );
  });

  afterAll(async () => {
    if (destroyHarness) {
      await destroyHarness();
    }
  });

  it('lists outbox events with filters', async () => {
    await dataSource.getRepository(OutboxEventEntity).save(
      dataSource.getRepository(OutboxEventEntity).create({
        eventType: 'notification.created',
        aggregateType: 'notification',
        aggregateId: 'n1',
        queue: 'notification.events',
        dedupeKey: `ops-test:${Date.now()}:1`,
        payload: { notificationId: 'n1' },
        status: 'pending',
        attempts: 0,
        lastError: null,
        availableAt: new Date(),
        dispatchedAt: null,
      }),
    );

    const events = await service.listOutboxEvents({ status: 'pending', limit: 10 });
    expect(events.length).toBeGreaterThan(0);
    expect(events.some((event) => event.aggregateType === 'notification')).toBe(true);
  });

  it('lists dead-lettered notifications with latest delivery context', async () => {
    const user = await dataSource.getRepository(UserEntity).save(
      dataSource.getRepository(UserEntity).create({
        email: `ops.deadletter.${Date.now()}@example.com`,
        fullName: 'Ops Dead Letter User',
        isActive: true,
        role: 'user',
      }),
    );

    const template = await dataSource.getRepository(NotificationTemplateEntity).save(
      dataSource.getRepository(NotificationTemplateEntity).create({
        name: `ops-dead-letter-template-${Date.now()}`,
        channel: 'push',
        titleTemplate: 'Dead letter template',
        bodyTemplate: 'Dead letter body',
        variablesSchema: null,
      }),
    );

    const notification = await dataSource.getRepository(NotificationEntity).save(
      dataSource.getRepository(NotificationEntity).create({
        userId: user.id,
        templateId: template.id,
        eventType: 'security_alerts',
        data: { deviceName: 'Unknown', location: 'Unknown' },
        status: 'dead_lettered',
        priority: 'critical',
        dedupeKey: `ops-dead-letter:${Date.now()}`,
        scheduledAt: null,
        processedAt: null,
      }),
    );

    await dataSource.getRepository(NotificationDeliveryEntity).save(
      dataSource.getRepository(NotificationDeliveryEntity).create({
        notificationId: notification.id,
        channel: 'push',
        provider: 'dispatch-worker',
        status: 'dead_lettered',
        retryCount: 5,
        errorMessage: 'Provider timeout',
        providerMessageId: null,
        sentAt: null,
        deliveredAt: null,
        lastAttemptAt: new Date('2026-03-07T00:00:00.000Z'),
      }),
    );

    const results = await service.listDeadLetteredNotifications(10);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.some((item) => item.id === notification.id && item.lastError === 'Provider timeout'),
    ).toBe(true);
  });
});
