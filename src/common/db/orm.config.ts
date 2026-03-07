import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LocalCredentialEntity } from '../../modules/auth/entity/local-credential.entity';
import { RefreshSessionEntity } from '../../modules/auth/entity/refresh-session.entity';
import { DeviceTokenEntity } from '../../modules/device-tokens/entity/device-token.entity';
import { NotificationTemplateEntity } from '../../modules/notification-templates/entity/notification-template.entity';
import { UserNotificationPreferenceEntity } from '../../modules/notification-preferences/entity/user-notification-preference.entity';
import { NotificationDeliveryEntity } from '../../modules/notifications/entity/notification-delivery.entity';
import { NotificationEntity } from '../../modules/notifications/entity/notification.entity';
import { NotificationLogEntity } from '../../modules/notifications/entity/notification-log.entity';
import { UserEntity } from '../../modules/users/entity/user.entity';
import { dbConfig } from './orm.base.config';
import { OutboxEventEntity } from '../mq/entities/outbox-event.entity';
import { ProcessedMessageEntity } from '../mq/entities/processed-message.entity';

export function getTypeOrmConfig(): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    username: dbConfig.username,
    password: dbConfig.password,
    synchronize: dbConfig.synchronize,
    logging: dbConfig.logging,
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
    migrations: ['dist/src/common/db/migrations/*.js'],
    migrationsRun: false,
    autoLoadEntities: true,
  };
}
