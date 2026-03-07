import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { AddAuthTables1710000001000 } from '../../src/common/db/migrations/1710000001000-AddAuthTables';
import { AddNotificationDomain1710000002000 } from '../../src/common/db/migrations/1710000002000-AddNotificationDomain';
import { CreateUsersTable1710000000000 } from '../../src/common/db/migrations/1710000000000-CreateUsersTable';
import { OutboxEventEntity } from '../../src/common/mq/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '../../src/common/mq/entities/processed-message.entity';
import { LocalCredentialEntity } from '../../src/modules/auth/entity/local-credential.entity';
import { RefreshSessionEntity } from '../../src/modules/auth/entity/refresh-session.entity';
import { DeviceTokenEntity } from '../../src/modules/device-tokens/entity/device-token.entity';
import { UserNotificationPreferenceEntity } from '../../src/modules/notification-preferences/entity/user-notification-preference.entity';
import { NotificationTemplateEntity } from '../../src/modules/notification-templates/entity/notification-template.entity';
import { NotificationDeliveryEntity } from '../../src/modules/notifications/entity/notification-delivery.entity';
import { NotificationEntity } from '../../src/modules/notifications/entity/notification.entity';
import { NotificationLogEntity } from '../../src/modules/notifications/entity/notification-log.entity';
import { UserEntity } from '../../src/modules/users/entity/user.entity';

export type PostgresTestHarness = {
  dataSource: DataSource;
  schema: string;
  destroy: () => Promise<void>;
};

const databaseOptions = {
  type: 'postgres' as const,
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'backend',
  username: process.env.DB_USER ?? 'backend',
  password: process.env.DB_PASSWORD ?? 'backend',
};

export async function createPostgresTestHarness(): Promise<PostgresTestHarness> {
  const schema = `test_${randomUUID().replace(/-/g, '_')}`;
  const adminDataSource = new DataSource(databaseOptions);
  await adminDataSource.initialize();
  await adminDataSource.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
  await adminDataSource.destroy();

  const dataSource = new DataSource({
    ...databaseOptions,
    schema,
    synchronize: false,
    logging: false,
    entities: [
      UserEntity,
      LocalCredentialEntity,
      RefreshSessionEntity,
      NotificationTemplateEntity,
      NotificationEntity,
      NotificationDeliveryEntity,
      UserNotificationPreferenceEntity,
      DeviceTokenEntity,
      NotificationLogEntity,
      OutboxEventEntity,
      ProcessedMessageEntity,
    ],
    migrations: [
      CreateUsersTable1710000000000,
      AddAuthTables1710000001000,
      AddNotificationDomain1710000002000,
    ],
  });

  await dataSource.initialize();
  await dataSource.query(`SET search_path TO "${schema}"`);
  await dataSource.runMigrations();

  return {
    dataSource,
    schema,
    destroy: async () => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      const cleanupDataSource = new DataSource(databaseOptions);
      await cleanupDataSource.initialize();
      await cleanupDataSource.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await cleanupDataSource.destroy();
    },
  };
}
