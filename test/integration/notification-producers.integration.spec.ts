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
import { UserCreatedConsumer } from '../../src/modules/users/consumer/user-created.consumer';
import { AuthLoginSucceededConsumer } from '../../src/modules/auth/consumer/auth-login-succeeded.consumer';

describe('Notification internal producers integration', () => {
  let dataSource: DataSource;
  let destroyHarness: () => Promise<void>;
  let usersRepository: UsersRepository;
  let notificationsRepository: NotificationsRepository;
  let notificationsService: NotificationsService;
  let templatesService: NotificationTemplatesService;
  let userCreatedConsumer: UserCreatedConsumer;
  let authLoginSucceededConsumer: AuthLoginSucceededConsumer;

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
    const notificationLogsRepository = new NotificationLogsRepository(
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

    userCreatedConsumer = new UserCreatedConsumer(
      {} as never,
      {} as never,
      templatesService,
      notificationsService,
    );

    authLoginSucceededConsumer = new AuthLoginSucceededConsumer(
      {} as never,
      {} as never,
      templatesService,
      notificationsService,
    );
  });

  afterAll(async () => {
    if (destroyHarness) {
      await destroyHarness();
    }
  });

  it('creates a welcome notification from a user.created event payload', async () => {
    const user = await usersRepository.createAndSave({
      email: 'producer.user.created@example.com',
      fullName: 'Producer User Created',
    });

    await templatesService.create({
      name: 'user-welcome-email',
      channel: 'email',
      titleTemplate: 'Welcome, {{fullName}}',
      bodyTemplate: 'Your account for {{email}} is ready.',
    });

    await userCreatedConsumer.handleUserCreated({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      occurredAt: '2026-03-07T00:00:00.000Z',
    });

    const created = await notificationsRepository.findByDedupeKey(
      `user.created:${user.id}:welcome`,
    );
    expect(created).not.toBeNull();
    expect(created?.eventType).toBe('account_updates');
    expect(created?.status).toBe('pending');
  });

  it('creates a security alert notification from an auth.login.succeeded payload', async () => {
    const user = await usersRepository.createAndSave({
      email: 'producer.auth.login@example.com',
      fullName: 'Producer Auth Login',
    });

    await templatesService.create({
      name: 'security-login-push',
      channel: 'push',
      titleTemplate: 'New login detected',
      bodyTemplate: 'A new login from {{deviceName}} at {{location}} was detected.',
    });

    await authLoginSucceededConsumer.handleLoginSucceeded({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      userAgent: 'Chrome on MacBook Pro',
      ipAddress: '127.0.0.1',
      occurredAt: '2026-03-07T00:10:00.000Z',
    });

    const created = await notificationsRepository.findByDedupeKey(
      `auth.login.succeeded:${user.id}:2026-03-07T00:10:00.000Z`,
    );
    expect(created).not.toBeNull();
    expect(created?.eventType).toBe('security_alerts');
    expect(created?.priority).toBe('critical');
    expect(created?.status).toBe('pending');
  });
});
