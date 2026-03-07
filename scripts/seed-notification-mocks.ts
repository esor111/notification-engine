import 'dotenv/config';
import 'reflect-metadata';
import dataSource from '../typeorm.datasource';
import { DeviceTokenEntity } from '../src/modules/device-tokens/entity/device-token.entity';
import { UserNotificationPreferenceEntity } from '../src/modules/notification-preferences/entity/user-notification-preference.entity';
import { NotificationTemplateEntity } from '../src/modules/notification-templates/entity/notification-template.entity';
import { NotificationDeliveryEntity } from '../src/modules/notifications/entity/notification-delivery.entity';
import { NotificationEntity } from '../src/modules/notifications/entity/notification.entity';
import { NotificationLogEntity } from '../src/modules/notifications/entity/notification-log.entity';
import {
  mockNotificationData,
  MOCK_NOTIFICATION_DEDUPE_PREFIX,
} from '../src/modules/notifications/mock/mock-notification-data';
import { UserEntity } from '../src/modules/users/entity/user.entity';

async function main(): Promise<void> {
  await dataSource.initialize();

  try {
    const userRepository = dataSource.getRepository(UserEntity);
    const templateRepository = dataSource.getRepository(NotificationTemplateEntity);
    const preferenceRepository = dataSource.getRepository(UserNotificationPreferenceEntity);
    const deviceTokenRepository = dataSource.getRepository(DeviceTokenEntity);
    const notificationRepository = dataSource.getRepository(NotificationEntity);
    const deliveryRepository = dataSource.getRepository(NotificationDeliveryEntity);
    const logRepository = dataSource.getRepository(NotificationLogEntity);

    let demoUser = await userRepository.findOne({
      where: { email: mockNotificationData.demoUser.email },
    });
    if (!demoUser) {
      demoUser = await userRepository.save(
        userRepository.create({
          email: mockNotificationData.demoUser.email,
          fullName: mockNotificationData.demoUser.fullName,
          isActive: true,
        }),
      );
    } else if (!demoUser.isActive || demoUser.fullName !== mockNotificationData.demoUser.fullName) {
      demoUser.isActive = true;
      demoUser.fullName = mockNotificationData.demoUser.fullName;
      demoUser = await userRepository.save(demoUser);
    }

    const templatesByName = new Map<string, NotificationTemplateEntity>();
    for (const template of mockNotificationData.templates) {
      const existing = await templateRepository.findOne({ where: { name: template.name } });
      const entity =
        existing ??
        templateRepository.create({
          name: template.name,
        });

      entity.channel = template.channel;
      entity.titleTemplate = template.titleTemplate;
      entity.bodyTemplate = template.bodyTemplate;
      entity.variablesSchema = template.variablesSchema ?? null;

      const saved = await templateRepository.save(entity);
      templatesByName.set(saved.name, saved);
    }

    for (const preference of mockNotificationData.preferences) {
      const existing = await preferenceRepository.findOne({
        where: {
          userId: demoUser.id,
          notificationType: preference.notificationType,
          channel: preference.channel,
        },
      });

      const entity =
        existing ??
        preferenceRepository.create({
          userId: demoUser.id,
          notificationType: preference.notificationType,
          channel: preference.channel,
        });

      entity.enabled = preference.enabled;
      await preferenceRepository.save(entity);
    }

    for (const token of mockNotificationData.deviceTokens) {
      const existing = await deviceTokenRepository.findOne({ where: { token: token.token } });
      const entity =
        existing ??
        deviceTokenRepository.create({
          token: token.token,
        });

      entity.userId = demoUser.id;
      entity.platform = token.platform;
      entity.isActive = token.isActive;
      entity.lastUsedAt = token.lastUsedAt ? new Date(token.lastUsedAt) : null;
      await deviceTokenRepository.save(entity);
    }

    await notificationRepository
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: demoUser.id })
      .andWhere('dedupe_key LIKE :prefix', { prefix: `${MOCK_NOTIFICATION_DEDUPE_PREFIX}%` })
      .execute();

    for (const mockNotification of mockNotificationData.notifications) {
      const template = templatesByName.get(mockNotification.templateName);
      if (!template) {
        throw new Error(`Missing template for mock notification: ${mockNotification.templateName}`);
      }

      const notification = await notificationRepository.save(
        notificationRepository.create({
          userId: demoUser.id,
          templateId: template.id,
          eventType: mockNotification.eventType,
          data: mockNotification.data,
          status: mockNotification.status,
          priority: mockNotification.priority,
          dedupeKey: mockNotification.dedupeKey,
          scheduledAt: null,
          processedAt: mockNotification.processedAt
            ? new Date(mockNotification.processedAt)
            : null,
        }),
      );

      if (mockNotification.delivery) {
        await deliveryRepository.save(
          deliveryRepository.create({
            notificationId: notification.id,
            channel: mockNotification.delivery.channel,
            provider: mockNotification.delivery.provider,
            status: mockNotification.delivery.status,
            retryCount: mockNotification.delivery.retryCount,
            errorMessage: mockNotification.delivery.errorMessage,
            providerMessageId: mockNotification.delivery.providerMessageId,
            sentAt: mockNotification.delivery.sentAt
              ? new Date(mockNotification.delivery.sentAt)
              : null,
            deliveredAt: mockNotification.delivery.deliveredAt
              ? new Date(mockNotification.delivery.deliveredAt)
              : null,
            lastAttemptAt: mockNotification.delivery.lastAttemptAt
              ? new Date(mockNotification.delivery.lastAttemptAt)
              : null,
          }),
        );
      }

      for (const log of mockNotification.logs) {
        await logRepository.save(
          logRepository.create({
            notificationId: notification.id,
            event: log.event,
            metadata: log.metadata ?? null,
          }),
        );
      }
    }

    console.log(
      `Seeded notification mocks for ${demoUser.email}: ${mockNotificationData.templates.length} templates, ${mockNotificationData.notifications.length} notifications.`,
    );
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to seed notification mocks: ${message}`);
  process.exitCode = 1;
});
