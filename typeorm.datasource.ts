import 'dotenv/config';
import { DataSource } from 'typeorm';
import { LocalCredentialEntity } from './src/modules/auth/entity/local-credential.entity';
import { RefreshSessionEntity } from './src/modules/auth/entity/refresh-session.entity';
import { DeviceTokenEntity } from './src/modules/device-tokens/entity/device-token.entity';
import { NotificationTemplateEntity } from './src/modules/notification-templates/entity/notification-template.entity';
import { UserNotificationPreferenceEntity } from './src/modules/notification-preferences/entity/user-notification-preference.entity';
import { NotificationDeliveryEntity } from './src/modules/notifications/entity/notification-delivery.entity';
import { NotificationEntity } from './src/modules/notifications/entity/notification.entity';
import { NotificationLogEntity } from './src/modules/notifications/entity/notification-log.entity';
import { OutboxEventEntity } from './src/common/mq/entities/outbox-event.entity';
import { ProcessedMessageEntity } from './src/common/mq/entities/processed-message.entity';
import { UserEntity } from './src/modules/users/entity/user.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME ?? 'backend',
  username: process.env.DB_USER ?? 'backend',
  password: process.env.DB_PASSWORD ?? 'backend',
  synchronize: false,
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
  migrations: ['src/common/db/migrations/*.ts'],
});
