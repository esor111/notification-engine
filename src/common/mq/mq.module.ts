import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEventEntity } from './entities/outbox-event.entity';
import { ProcessedMessageEntity } from './entities/processed-message.entity';
import { MQ_MESSAGE_PUBLISHER } from './message.publisher';
import { OutboxProcessor } from './outbox.processor';
import { OutboxService } from './outbox.service';
import { ProcessedMessagesService } from './processed-messages.service';
import { RabbitMqClient } from './rabbitmq.client';
import { RabbitMqMessagePublisher } from './rabbitmq.publisher';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEventEntity, ProcessedMessageEntity])],
  providers: [
    RabbitMqClient,
    RabbitMqMessagePublisher,
    OutboxService,
    OutboxProcessor,
    ProcessedMessagesService,
    {
      provide: MQ_MESSAGE_PUBLISHER,
      useExisting: RabbitMqMessagePublisher,
    },
  ],
  exports: [RabbitMqClient, OutboxService, ProcessedMessagesService, MQ_MESSAGE_PUBLISHER],
})
export class MqModule {}
