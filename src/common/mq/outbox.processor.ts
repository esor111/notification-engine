import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { appConfig } from '../config/configuration';
import { MQ_MESSAGE_PUBLISHER, MqMessagePublisher } from './message.publisher';
import { OutboxService } from './outbox.service';

@Injectable()
export class OutboxProcessor implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(OutboxProcessor.name);
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(
    private readonly outboxService: OutboxService,
    @Inject(MQ_MESSAGE_PUBLISHER)
    private readonly publisher: MqMessagePublisher,
  ) {}

  onApplicationBootstrap(): void {
    if (appConfig.nodeEnv === 'test') {
      return;
    }

    this.timer = setInterval(() => {
      void this.flush();
    }, appConfig.mq.outboxPollIntervalMs);

    void this.flush();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    try {
      const events = await this.outboxService.claimPendingBatch(appConfig.mq.outboxBatchSize);
      for (const event of events) {
        try {
          await this.publisher.publish({
            messageId: event.id,
            eventType: event.eventType,
            queue: event.queue,
            dedupeKey: event.dedupeKey,
            payload: event.payload,
          });
          await this.outboxService.markDispatched(event.id);
        } catch (error) {
          await this.outboxService.markFailed(
            event.id,
            event.attempts,
            error instanceof Error ? error.message : 'Unknown publish error',
          );
          this.logger.error(
            `Failed to dispatch outbox event ${event.id}: ${
              error instanceof Error ? error.message : 'Unknown publish error'
            }`,
          );
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }
}
