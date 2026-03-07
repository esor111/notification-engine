import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { mqConfig } from './mq.config';

type ReceivedMessage = {
  messageId: string;
  eventType: string;
  queue: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
};

@Injectable()
export class RabbitMqClient implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqClient.name);
  private connection: ChannelModel | null = null;
  private publishChannel: Channel | null = null;
  private consumeChannel: Channel | null = null;

  async assertReady(): Promise<void> {
    await this.getPublishChannel();
  }

  async publish(message: ReceivedMessage): Promise<void> {
    const channel = await this.getPublishChannel();
    await channel.assertQueue(message.queue, { durable: true });
    channel.sendToQueue(message.queue, Buffer.from(JSON.stringify(message.payload)), {
      persistent: true,
      contentType: 'application/json',
      type: message.eventType,
      messageId: message.messageId,
      headers: {
        dedupeKey: message.dedupeKey,
      },
    });
  }

  async consume(
    queue: string,
    handler: (message: ReceivedMessage) => Promise<void>,
  ): Promise<void> {
    const channel = await this.getConsumeChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(mqConfig.prefetchCount);
    await channel.consume(queue, async (message) => {
      if (!message) {
        return;
      }

      await this.handleMessage(queue, message, handler);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumeChannel?.close().catch(() => undefined);
    await this.publishChannel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async handleMessage(
    queue: string,
    message: ConsumeMessage,
    handler: (received: ReceivedMessage) => Promise<void>,
  ): Promise<void> {
    const channel = this.consumeChannel;
    if (!channel) {
      return;
    }

    try {
      const payload = JSON.parse(message.content.toString()) as Record<string, unknown>;
      await handler({
        messageId: message.properties.messageId ?? '',
        eventType: message.properties.type ?? 'unknown',
        queue,
        payload,
        dedupeKey: message.properties.headers?.dedupeKey as string | undefined,
      });
      channel.ack(message);
    } catch (error) {
      this.logger.error(
        `Failed to process MQ message on ${queue}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      channel.nack(message, false, true);
    }
  }

  private async getPublishChannel(): Promise<Channel> {
    if (this.publishChannel) {
      return this.publishChannel;
    }

    const connection = await this.getConnection();
    const channel = await connection.createChannel();
    this.publishChannel = channel;
    return channel;
  }

  private async getConsumeChannel(): Promise<Channel> {
    if (this.consumeChannel) {
      return this.consumeChannel;
    }

    const connection = await this.getConnection();
    const channel = await connection.createChannel();
    this.consumeChannel = channel;
    return channel;
  }

  private async getConnection(): Promise<ChannelModel> {
    if (this.connection) {
      return this.connection;
    }

    const connection = await connect(mqConfig.url);
    connection.on('close', () => {
      this.logger.warn('RabbitMQ connection closed');
      this.connection = null;
      this.publishChannel = null;
      this.consumeChannel = null;
    });
    connection.on('error', (error) => {
      this.logger.error(`RabbitMQ connection error: ${error.message}`);
    });
    this.connection = connection;
    return connection;
  }
}
