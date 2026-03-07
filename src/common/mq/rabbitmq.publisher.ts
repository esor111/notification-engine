import { Injectable } from '@nestjs/common';
import { MqMessagePublisher, PublishableMessage } from './message.publisher';
import { RabbitMqClient } from './rabbitmq.client';

@Injectable()
export class RabbitMqMessagePublisher implements MqMessagePublisher {
  constructor(private readonly rabbitMqClient: RabbitMqClient) {}

  async publish(message: PublishableMessage): Promise<void> {
    await this.rabbitMqClient.publish(message);
  }
}
