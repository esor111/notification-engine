import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { UserEntity } from '../../src/modules/users/entity/user.entity';
import { createE2eApp } from '../support/create-e2e-app';

async function registerUser(app: INestApplication, email: string) {
  const response = await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      email,
      fullName: 'Authorization E2E User',
      password: 'Password123!',
    })
    .expect(201);

  return response.body as {
    accessToken: string;
    user: { id: string; email: string; role: 'user' | 'admin' };
  };
}

describe('Authorization (e2e)', () => {
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

  it('blocks regular users from admin-only endpoints and allows promoted admins', async () => {
    const regularUser = await registerUser(app, `authz.user.${Date.now()}@example.com`);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/notification-templates')
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .send({
        name: `forbidden-template-${Date.now()}`,
        channel: 'email',
        titleTemplate: 'Forbidden',
        bodyTemplate: 'Forbidden',
      })
      .expect(403);

    await request(app.getHttpServer())
      .get('/notification-ops/outbox')
      .set('Authorization', `Bearer ${regularUser.accessToken}`)
      .expect(403);

    await dataSource
      .getRepository(UserEntity)
      .update({ id: regularUser.user.id }, { role: 'admin' });

    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: regularUser.user.email,
        password: 'Password123!',
      })
      .expect(200);

    expect(adminLogin.body.user.role).toBe('admin');

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body[0].role).toBeDefined();
      });

    await request(app.getHttpServer())
      .post('/notification-templates')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .send({
        name: `admin-template-${Date.now()}`,
        channel: 'email',
        titleTemplate: 'Admin template',
        bodyTemplate: 'Admin template body',
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.name).toContain('admin-template-');
      });

    await request(app.getHttpServer())
      .get('/notification-ops/outbox')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
