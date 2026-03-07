import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { appConfig } from '../../../common/config/configuration';
import { mqConfig } from '../../../common/mq/mq.config';
import { ProcessedMessagesService } from '../../../common/mq/processed-messages.service';
import { RabbitMqClient } from '../../../common/mq/rabbitmq.client';
import { NotificationDispatchService } from '../service/notification-dispatch.service';

@Injectable()
export class NotificationDispatchConsumer implements OnApplicationBootstrap {
  private readonly consumerName = 'notification-dispatch-consumer';

  constructor(
    private readonly rabbitMqClient: RabbitMqClient,
    private readonly processedMessagesService: ProcessedMessagesService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  onApplicationBootstrap(): void {
    if (appConfig.nodeEnv === 'test') {
      return;
    }

    void this.rabbitMqClient.consume(mqConfig.notificationEventsQueue, async (message) => {
      const messageId = message.messageId || `notification:${Date.now()}`;
      await this.processedMessagesService.processOnce(this.consumerName, messageId, async () => {
        const payload = message.payload as unknown as { notificationId: string; attempt?: number };
        await this.notificationDispatchService.dispatch(payload);
      });
    });
  }
}
