import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditService } from '../../common/audit/audit.service';
import { OutboxEventEntity } from '../../common/mq/entities/outbox-event.entity';
import { DeviceTokensController } from '../device-tokens/controller/device-tokens.controller';
import { DeviceTokenEntity } from '../device-tokens/entity/device-token.entity';
import { DeviceTokensRepository } from '../device-tokens/repository/device-tokens.repository';
import { DeviceTokensService } from '../device-tokens/service/device-tokens.service';
import { NotificationPreferencesController } from '../notification-preferences/controller/notification-preferences.controller';
import { UserNotificationPreferenceEntity } from '../notification-preferences/entity/user-notification-preference.entity';
import { NotificationPreferencesRepository } from '../notification-preferences/repository/notification-preferences.repository';
import { NotificationPreferencesService } from '../notification-preferences/service/notification-preferences.service';
import { NotificationTemplatesController } from '../notification-templates/controller/notification-templates.controller';
import { NotificationTemplateEntity } from '../notification-templates/entity/notification-template.entity';
import { NotificationTemplatesRepository } from '../notification-templates/repository/notification-templates.repository';
import { NotificationTemplatesService } from '../notification-templates/service/notification-templates.service';
import { EmailNotificationProvider } from '../providers/email/email-notification.provider';
import { PushNotificationProvider } from '../providers/push/push-notification.provider';
import { UserEntity } from '../users/entity/user.entity';
import { UsersRepository } from '../users/repository/users.repository';
import { NotificationDispatchConsumer } from './consumer/notification-dispatch.consumer';
import { NotificationOperationsController } from './controller/notification-operations.controller';
import { NotificationsController } from './controller/notifications.controller';
import { NotificationDeliveryEntity } from './entity/notification-delivery.entity';
import { NotificationEntity } from './entity/notification.entity';
import { NotificationLogEntity } from './entity/notification-log.entity';
import { NotificationDeliveriesRepository } from './repository/notification-deliveries.repository';
import { NotificationLogsRepository } from './repository/notification-logs.repository';
import { NotificationsRepository } from './repository/notifications.repository';
import { NotificationDispatchService } from './service/notification-dispatch.service';
import { NotificationOperationsService } from './service/notification-operations.service';
import { NotificationRendererService } from './service/notification-renderer.service';
import { NotificationsService } from './service/notifications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      NotificationTemplateEntity,
      NotificationEntity,
      NotificationDeliveryEntity,
      NotificationLogEntity,
      UserNotificationPreferenceEntity,
      DeviceTokenEntity,
      OutboxEventEntity,
    ]),
  ],
  controllers: [
    NotificationTemplatesController,
    NotificationsController,
    NotificationPreferencesController,
    DeviceTokensController,
    NotificationOperationsController,
  ],
  providers: [
    NotificationTemplatesRepository,
    NotificationTemplatesService,
    NotificationsRepository,
    NotificationDeliveriesRepository,
    NotificationLogsRepository,
    NotificationPreferencesRepository,
    NotificationPreferencesService,
    DeviceTokensRepository,
    DeviceTokensService,
    NotificationsService,
    NotificationDispatchService,
    NotificationOperationsService,
    NotificationDispatchConsumer,
    NotificationRendererService,
    EmailNotificationProvider,
    PushNotificationProvider,
    UsersRepository,
    AuditService,
  ],
  exports: [NotificationTemplatesService, NotificationsService],
})
export class NotificationsModule {}
