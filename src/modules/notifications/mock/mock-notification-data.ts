import { DeviceTokenEntity } from '../../device-tokens/entity/device-token.entity';
import { UserNotificationPreferenceEntity } from '../../notification-preferences/entity/user-notification-preference.entity';
import {
  NotificationChannel,
  NotificationTemplateEntity,
} from '../../notification-templates/entity/notification-template.entity';
import { NotificationDeliveryStatus } from '../entity/notification-delivery.entity';
import { NotificationPriority, NotificationStatus } from '../entity/notification.entity';

type MockTemplate = Pick<
  NotificationTemplateEntity,
  'name' | 'channel' | 'titleTemplate' | 'bodyTemplate' | 'variablesSchema'
>;

type MockPreference = Pick<
  UserNotificationPreferenceEntity,
  'notificationType' | 'channel' | 'enabled'
>;

type MockDeviceToken = Pick<DeviceTokenEntity, 'token' | 'platform' | 'isActive'> & {
  lastUsedAt: string | null;
};

type MockNotificationLog = {
  event: string;
  metadata: Record<string, unknown> | null;
};

type MockDelivery = {
  channel: NotificationChannel;
  provider: string;
  status: NotificationDeliveryStatus;
  retryCount: number;
  errorMessage: string | null;
  providerMessageId: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  lastAttemptAt: string | null;
};

type MockNotification = {
  templateName: string;
  eventType: string;
  status: NotificationStatus;
  priority: NotificationPriority;
  dedupeKey: string;
  data: Record<string, unknown>;
  processedAt: string | null;
  delivery: MockDelivery | null;
  logs: MockNotificationLog[];
};

export const MOCK_NOTIFICATION_DEDUPE_PREFIX = 'mock:';

export const mockNotificationData: {
  demoUser: { email: string; fullName: string };
  templates: MockTemplate[];
  preferences: MockPreference[];
  deviceTokens: MockDeviceToken[];
  notifications: MockNotification[];
} = {
  demoUser: {
    email: 'demo.notifications@example.com',
    fullName: 'Demo Notifications User',
  },
  templates: [
    {
      name: 'order-shipped-email',
      channel: 'email',
      titleTemplate: 'Your order {{orderId}} shipped',
      bodyTemplate: 'Order {{orderId}} is on the way. ETA: {{eta}}.',
      variablesSchema: {
        orderId: { type: 'string' },
        eta: { type: 'string' },
      },
    },
    {
      name: 'security-login-push',
      channel: 'push',
      titleTemplate: 'New login detected',
      bodyTemplate: 'A new login from {{deviceName}} at {{location}} was detected.',
      variablesSchema: {
        deviceName: { type: 'string' },
        location: { type: 'string' },
      },
    },
    {
      name: 'weekly-digest-email',
      channel: 'email',
      titleTemplate: 'Your weekly digest is ready',
      bodyTemplate: 'You have {{unreadCount}} unread updates this week.',
      variablesSchema: {
        unreadCount: { type: 'number' },
      },
    },
  ],
  preferences: [
    { notificationType: 'order_updates', channel: 'email', enabled: true },
    { notificationType: 'security_alerts', channel: 'push', enabled: true },
    { notificationType: 'marketing_digest', channel: 'email', enabled: false },
  ],
  deviceTokens: [
    {
      token: 'mock-ios-demo-token',
      platform: 'ios',
      isActive: true,
      lastUsedAt: '2026-03-07T09:30:00.000Z',
    },
    {
      token: 'mock-web-demo-token',
      platform: 'web',
      isActive: true,
      lastUsedAt: null,
    },
  ],
  notifications: [
    {
      templateName: 'order-shipped-email',
      eventType: 'order_updates',
      status: 'sent',
      priority: 'normal',
      dedupeKey: 'mock:order:A1001:shipped',
      data: {
        orderId: 'A1001',
        eta: '2026-03-09',
      },
      processedAt: '2026-03-07T10:00:00.000Z',
      delivery: {
        channel: 'email',
        provider: 'console-email',
        status: 'sent',
        retryCount: 0,
        errorMessage: null,
        providerMessageId: 'mock-email-1',
        sentAt: '2026-03-07T10:00:00.000Z',
        deliveredAt: null,
        lastAttemptAt: '2026-03-07T10:00:00.000Z',
      },
      logs: [
        { event: 'queued', metadata: { priority: 'normal' } },
        {
          event: 'sent',
          metadata: { channel: 'email', provider: 'console-email', attempt: 1 },
        },
      ],
    },
    {
      templateName: 'security-login-push',
      eventType: 'security_alerts',
      status: 'sent',
      priority: 'critical',
      dedupeKey: 'mock:security:login:1',
      data: {
        deviceName: 'Chrome on MacBook Pro',
        location: 'Kathmandu, NP',
      },
      processedAt: '2026-03-07T10:15:00.000Z',
      delivery: {
        channel: 'push',
        provider: 'console-push',
        status: 'sent',
        retryCount: 0,
        errorMessage: null,
        providerMessageId: 'mock-push-1',
        sentAt: '2026-03-07T10:15:00.000Z',
        deliveredAt: null,
        lastAttemptAt: '2026-03-07T10:15:00.000Z',
      },
      logs: [
        { event: 'queued', metadata: { priority: 'critical' } },
        {
          event: 'sent',
          metadata: { channel: 'push', provider: 'console-push', attempt: 1 },
        },
      ],
    },
    {
      templateName: 'weekly-digest-email',
      eventType: 'marketing_digest',
      status: 'skipped',
      priority: 'bulk',
      dedupeKey: 'mock:marketing:digest:2026w10',
      data: {
        unreadCount: 7,
      },
      processedAt: '2026-03-07T10:30:00.000Z',
      delivery: {
        channel: 'email',
        provider: 'preference-filter',
        status: 'skipped',
        retryCount: 0,
        errorMessage: 'User preference disabled',
        providerMessageId: null,
        sentAt: null,
        deliveredAt: null,
        lastAttemptAt: '2026-03-07T10:30:00.000Z',
      },
      logs: [
        { event: 'queued', metadata: { priority: 'bulk' } },
        {
          event: 'skipped',
          metadata: {
            channel: 'email',
            reason: 'User preference disabled',
            attempt: 1,
          },
        },
      ],
    },
    {
      templateName: 'security-login-push',
      eventType: 'security_alerts',
      status: 'dead_lettered',
      priority: 'critical',
      dedupeKey: 'mock:security:push:dead-letter',
      data: {
        deviceName: 'Unknown Device',
        location: 'Unknown',
      },
      processedAt: null,
      delivery: {
        channel: 'push',
        provider: 'dispatch-worker',
        status: 'dead_lettered',
        retryCount: 5,
        errorMessage: 'Mock provider timeout',
        providerMessageId: null,
        sentAt: null,
        deliveredAt: null,
        lastAttemptAt: '2026-03-07T10:45:00.000Z',
      },
      logs: [
        { event: 'queued', metadata: { priority: 'critical' } },
        {
          event: 'retry_scheduled',
          metadata: { channel: 'push', attempt: 2, errorMessage: 'Mock provider timeout' },
        },
        {
          event: 'dead_lettered',
          metadata: { channel: 'push', attempt: 5, errorMessage: 'Mock provider timeout' },
        },
      ],
    },
  ],
};
