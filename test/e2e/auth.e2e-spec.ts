import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp } from '../support/create-e2e-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let destroyApp: () => Promise<void>;

  beforeAll(async () => {
    const e2eApp = await createE2eApp();
    app = e2eApp.app;
    destroyApp = e2eApp.destroy;
  });

  afterAll(async () => {
    if (destroyApp) {
      await destroyApp();
    }
  });

  it('requires authentication for /auth/me', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('registers, logs in, rotates refresh tokens, and logs out', async () => {
    const email = `auth.e2e.${Date.now()}@example.com`;
    const password = 'Password123!';

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        fullName: 'Auth E2E User',
        password,
      })
      .expect(201);

    expect(registerResponse.body.user.email).toBe(email);
    expect(typeof registerResponse.body.accessToken).toBe('string');
    expect(typeof registerResponse.body.refreshToken).toBe('string');

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(email);
        expect(body.fullName).toBe('Auth E2E User');
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email,
        password,
      })
      .expect(200);

    expect(loginResponse.body.refreshToken).not.toBe(registerResponse.body.refreshToken);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(200);

    expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: loginResponse.body.refreshToken,
      })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({
        refreshToken: refreshResponse.body.refreshToken,
      })
      .expect(401);
  });
});
