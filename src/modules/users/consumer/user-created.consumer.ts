import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { appConfig } from '../../../common/config/configuration';
import { mqConfig } from '../../../common/mq/mq.config';
import { ProcessedMessagesService } from '../../../common/mq/processed-messages.service';
import { RabbitMqClient } from '../../../common/mq/rabbitmq.client';

type UserCreatedPayload = {
  userId: string;
  email: string;
  occurredAt: string;
};

@Injectable()
export class UserCreatedConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserCreatedConsumer.name);
  private readonly consumerName = 'user-created-audit-consumer';

  constructor(
    private readonly rabbitMqClient: RabbitMqClient,
    private readonly processedMessagesService: ProcessedMessagesService,
  ) {}

  onApplicationBootstrap(): void {
    if (appConfig.nodeEnv === 'test') {
      return;
    }

    void this.rabbitMqClient.consume(mqConfig.userCreatedQueue, async (message) => {
      const messageId = message.messageId || `missing:${message.eventType}`;
      await this.processedMessagesService.processOnce(this.consumerName, messageId, async () => {
        const payload = message.payload as unknown as UserCreatedPayload;
        this.logger.log(`Handled user.created for user=${payload.userId} email=${payload.email}`);
      });
    });
  }
}
