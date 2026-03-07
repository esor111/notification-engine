import { Controller, Get, Res } from '@nestjs/common';
import { ApiOkResponse, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../../common/auth/public.decorator';
import { HealthService } from '../service/health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        service: { type: 'string', example: 'backend-api' },
      },
    },
  })
  getHealth() {
    return this.healthService.getLiveness();
  }

  @Public()
  @Get('ready')
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        checks: {
          type: 'object',
          properties: {
            database: { type: 'string', example: 'up' },
            mq: { type: 'string', example: 'up' },
          },
        },
      },
    },
  })
  @ApiServiceUnavailableResponse({
    description: 'Service dependencies are not ready',
  })
  async getReadiness(@Res({ passthrough: true }) response: Response) {
    const readiness = await this.healthService.getReadiness();
    if (!readiness.ready) {
      response.status(503);
    }

    return readiness;
  }
}
