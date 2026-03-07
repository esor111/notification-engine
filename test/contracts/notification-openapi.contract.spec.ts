import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('OpenAPI notification contract', () => {
  const contract = readFileSync(join(process.cwd(), 'openapi', 'openapi.yaml'), 'utf8');

  it('defines the notification lifecycle endpoints', () => {
    expect(contract).toContain('/notification-templates:');
    expect(contract).toContain('/notifications:');
    expect(contract).toContain('/notifications/{id}/deliveries:');
    expect(contract).toContain('/notifications/{id}/logs:');
    expect(contract).toContain('/notification-preferences:');
    expect(contract).toContain('/device-tokens:');
  });

  it('keeps notification creation scoped to the current authenticated user', () => {
    const notificationSectionStart = contract.split('    CreateNotificationRequest:')[1];

    expect(notificationSectionStart).toBeDefined();
    const createNotificationRequestSection =
      notificationSectionStart!.split('    Notification:')[0];

    expect(createNotificationRequestSection).toContain('required: [templateId, eventType, data]');
    expect(createNotificationRequestSection).not.toContain('userId:');
  });

  it('documents notification logs and terminal statuses', () => {
    expect(contract).toContain('    NotificationLog:');
    expect(contract).toContain('dead_lettered');
    expect(contract).toContain('summary: List lifecycle log entries for a notification');
  });

  it('documents admin-only notification template access and user roles', () => {
    expect(contract).toContain('/notification-templates:');
    expect(contract).toContain('description: Admin role required');
    expect(contract).toContain('enum: [user, admin]');
  });
});
