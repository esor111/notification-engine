import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createPostgresTestHarness } from './postgres-test-datasource';

type E2eApp = {
  app: INestApplication;
  dataSource: DataSource;
  destroy: () => Promise<void>;
};

export async function createE2eApp(): Promise<E2eApp> {
  const harness = await createPostgresTestHarness();
  const originalEnv = { ...process.env };

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
  process.env.DB_PORT = process.env.DB_PORT ?? '5433';
  process.env.DB_NAME = process.env.DB_NAME ?? 'backend';
  process.env.DB_USER = process.env.DB_USER ?? 'backend';
  process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'backend';
  process.env.DB_SCHEMA = harness.schema;
  process.env.DB_LOGGING = 'false';
  process.env.AUTH_ACCESS_TOKEN_SECRET =
    process.env.AUTH_ACCESS_TOKEN_SECRET ?? 'e2e-access-secret';
  process.env.AUTH_REFRESH_TOKEN_SECRET =
    process.env.AUTH_REFRESH_TOKEN_SECRET ?? 'e2e-refresh-secret';
  process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS = process.env.AUTH_ACCESS_TOKEN_TTL_SECONDS ?? '900';
  process.env.AUTH_REFRESH_TOKEN_TTL_DAYS = process.env.AUTH_REFRESH_TOKEN_TTL_DAYS ?? '30';
  process.env.AUTH_PASSWORD_PEPPER = process.env.AUTH_PASSWORD_PEPPER ?? '';
  process.env.NOTIFICATION_EVENTS_QUEUE =
    process.env.NOTIFICATION_EVENTS_QUEUE ?? 'notification.events';
  process.env.USER_CREATED_QUEUE = process.env.USER_CREATED_QUEUE ?? 'user.created';

  jest.resetModules();

  const [{ Test }, { AppModule }, { configureApp }] = await Promise.all([
    import('@nestjs/testing'),
    import('../../src/app.module'),
    import('../../src/app.factory'),
  ]);

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(moduleRef.createNestApplication());
  await app.init();

  return {
    app,
    dataSource: harness.dataSource,
    destroy: async () => {
      await app.close();
      process.env = originalEnv;
      await harness.destroy();
    },
  };
}
