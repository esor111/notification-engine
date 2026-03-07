import { Injectable } from '@nestjs/common';
import { appConfig } from '../../../common/config/configuration';
import { ReadinessService } from '../../../common/health/readiness.service';

@Injectable()
export class HealthService {
  constructor(private readonly readinessService: ReadinessService) {}

  getLiveness() {
    return { status: 'ok', service: appConfig.serviceName };
  }

  async getReadiness() {
    const checks = await this.readinessService.checkDependencies();
    const ready = Object.values(checks).every((value) => value === 'up');

    return {
      status: ready ? 'ok' : 'degraded',
      ready,
      checks,
    };
  }
}
