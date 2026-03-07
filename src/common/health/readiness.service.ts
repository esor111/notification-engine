import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RabbitMqClient } from '../mq/rabbitmq.client';

type DependencyStatus = 'up' | 'down';

@Injectable()
export class ReadinessService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly rabbitMqClient: RabbitMqClient,
  ) {}

  async checkDependencies(): Promise<{ database: DependencyStatus; mq: DependencyStatus }> {
    const [database, mq] = await Promise.all([this.checkDatabase(), this.checkMq()]);

    return { database, mq };
  }

  private async checkDatabase(): Promise<DependencyStatus> {
    try {
      await this.dataSource.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkMq(): Promise<DependencyStatus> {
    try {
      await this.rabbitMqClient.assertReady();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
