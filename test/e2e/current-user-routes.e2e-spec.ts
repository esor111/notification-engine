import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { NotificationTemplateEntity } from '../../src/modules/notification-templates/entity/notification-template.entity';
import { createE2eApp } from '../support/create-e2e-app';

async function registerUser(app: INestApplication, email: string) {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      fullName: 'Current User E2E',
      password: 'Password123!',
    })
    .expect(201);

  return response.body as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string };
  };
}

describe('Current user routes (e2e)', () => {
  let app: INestApplication;
  let destroyApp: () => Promise<void>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const e2eApp = await createE2eApp();
    app = e2eApp.app;
    dataSource = e2eApp.dataSource;
    destroyApp = e2eApp.destroy;
  });

  afterAll(async () => {
    if (destroyApp) {
      await destroyApp();
    }
  });

  it('keeps notification, preference, and device-token data scoped to the authenticated user', async () => {
    const userOne = await registerUser(app, `current.user.one.${Date.now()}@example.com`);
    const userTwo = await registerUser(app, `current.user.two.${Date.now()}@example.com`);

    const template = await dataSource.getRepository(NotificationTemplateEntity).save(
      dataSource.getRepository(NotificationTemplateEntity).create({
        name: `order-updated-${Date.now()}`,
        channel: 'email',
        titleTemplate: 'Order {{orderId}} updated',
        bodyTemplate: 'Order {{orderId}} is now {{status}}.',
        variablesSchema: {
          orderId: { type: 'string' },
          status: { type: 'string' },
        },
      }),
    );

    await request(app.getHttpServer())
      .post('/notification-preferences')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .send({
        notificationType: 'order_updates',
        channel: 'email',
        enabled: true,
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.userId).toBe(userOne.user.id);
        expect(body.notificationType).toBe('order_updates');
      });

    await request(app.getHttpServer())
      .post('/device-tokens')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .send({
        token: `device-token-${Date.now()}`,
        platform: 'web',
      })
      .expect(200)
      .expect(({ body }) => {
        expect(body.userId).toBe(userOne.user.id);
        expect(body.platform).toBe('web');
      });

    const notificationResponse = await request(app.getHttpServer())
      .post('/notifications')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .send({
        templateId: template.id,
        eventType: 'order_updates',
        data: {
          orderId: 'E2E-1001',
          status: 'shipped',
        },
        dedupeKey: `e2e:${Date.now()}:order-updated`,
      })
      .expect(201);

    const notificationId = notificationResponse.body.id as string;
    expect(notificationResponse.body.userId).toBe(userOne.user.id);
    expect(notificationResponse.body.status).toBe('pending');

    await request(app.getHttpServer())
      .get('/notification-preferences')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].userId).toBe(userOne.user.id);
      });

    await request(app.getHttpServer())
      .get('/device-tokens')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].userId).toBe(userOne.user.id);
      });

    await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].id).toBe(notificationId);
        expect(body[0].userId).toBe(userOne.user.id);
      });

    await request(app.getHttpServer())
      .get(`/notifications/${notificationId}/logs`)
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].event).toBe('queued');
      });

    await request(app.getHttpServer())
      .get(`/notifications/${notificationId}/deliveries`)
      .set('Authorization', `Bearer ${userOne.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${userTwo.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual([]);
      });

    await request(app.getHttpServer())
      .get(`/notifications/${notificationId}/logs`)
      .set('Authorization', `Bearer ${userTwo.accessToken}`)
      .expect(404);

    await request(app.getHttpServer())
      .get(`/notifications/${notificationId}/deliveries`)
      .set('Authorization', `Bearer ${userTwo.accessToken}`)
      .expect(404);
  });
});
