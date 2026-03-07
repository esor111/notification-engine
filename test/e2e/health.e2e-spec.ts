import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ReadinessService } from '../../src/common/health/readiness.service';
import { HealthController } from '../../src/modules/health/controller/health.controller';
import { HealthService } from '../../src/modules/health/service/health.service';

const readinessService = {
  checkDependencies: jest.fn(),
};

@Module({
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: ReadinessService,
      useValue: readinessService,
    },
  ],
})
class TestHealthModule {}

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    readinessService.checkDependencies.mockResolvedValue({ database: 'up', mq: 'up' });
    const moduleRef = await Test.createTestingModule({
      imports: [TestHealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body).toEqual({ status: 'ok', service: 'backend-api' });
  });

  it('/health/ready (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(response.body).toEqual({
      status: 'ok',
      ready: true,
      checks: { database: 'up', mq: 'up' },
    });
  });
});
