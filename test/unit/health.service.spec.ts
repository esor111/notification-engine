import { Test, TestingModule } from '@nestjs/testing';
import { ReadinessService } from '../../src/common/health/readiness.service';
import { HealthService } from '../../src/modules/health/service/health.service';

describe('HealthService', () => {
  let service: HealthService;
  const readinessService = {
    checkDependencies: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: ReadinessService, useValue: readinessService }],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('returns liveness status', () => {
    expect(service.getLiveness()).toEqual({ status: 'ok', service: 'backend-api' });
  });

  it('returns readiness details', async () => {
    readinessService.checkDependencies.mockResolvedValue({ database: 'up', mq: 'up' });

    await expect(service.getReadiness()).resolves.toEqual({
      status: 'ok',
      ready: true,
      checks: { database: 'up', mq: 'up' },
    });
  });
});
