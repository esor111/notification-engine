import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Channel, ChannelModel, ConsumeMessage, connect } from 'amqplib';
import { mqConfig } from './mq.config';
import { mqMessagePublished, mqMessageConsumed, mqMessageProcessingDuration } from '../observability/metrics';

type ReceivedMessage = {
  messageId: string;
  eventType: string;
  queue: string;
  payload: Record<string, unknown>;
  dedupeKey?: string;
};

type ConsumerRegistration = {
  queue: string;
  handler: (message: ReceivedMessage) => Promise<void>;
};

@Injectable()
export class RabbitMqClient implements OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqClient.name);
  private connection: ChannelModel | null = null;
  private publishChannel: Channel | null = null;
  private consumeChannel: Channel | null = null;
  private consumerRegistry: ConsumerRegistration[] = [];
  private isReconnecting = false;

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
    
    // Record metric
    mqMessagePublished.inc({ queue: message.queue, event_type: message.eventType });
  }

  async consume(
    queue: string,
    handler: (message: ReceivedMessage) => Promise<void>,
  ): Promise<void> {
    // Register consumer for reconnection
    const existingIndex = this.consumerRegistry.findIndex((c) => c.queue === queue);
    if (existingIndex >= 0) {
      this.consumerRegistry[existingIndex] = { queue, handler };
    } else {
      this.consumerRegistry.push({ queue, handler });
    }

    const channel = await this.getConsumeChannel();
    await channel.assertQueue(queue, { durable: true });
    await channel.prefetch(mqConfig.prefetchCount);
    await channel.consume(
      queue,
      async (message) => {
        if (!message) {
          return;
        }

        // Pass the channel that received this message
        await this.handleMessage(queue, channel, message, handler);
      },
      { noAck: false },
    );

    this.logger.log(`Consumer registered for queue: ${queue}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.consumeChannel?.close().catch(() => undefined);
    await this.publishChannel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  private async handleMessage(
    queue: string,
    messageChannel: Channel,
    message: ConsumeMessage,
    handler: (received: ReceivedMessage) => Promise<void>,
  ): Promise<void> {
    const startTime = Date.now();
    try {
      const payload = JSON.parse(message.content.toString()) as Record<string, unknown>;
      await handler({
        messageId: message.properties.messageId ?? '',
        eventType: message.properties.type ?? 'unknown',
        queue,
        payload,
        dedupeKey: message.properties.headers?.dedupeKey as string | undefined,
      });

      // Record success metrics
      const durationSeconds = (Date.now() - startTime) / 1000;
      mqMessageConsumed.inc({ queue, status: 'success' });
      mqMessageProcessingDuration.observe({ queue, consumer: 'handler' }, durationSeconds);

      // Use the channel that received this message for ack
      try {
        messageChannel.ack(message);
      } catch (ackError) {
        this.logger.error(
          `Failed to ack message ${message.properties.messageId}: ${
            ackError instanceof Error ? ackError.message : 'Unknown error'
          }`,
        );
      }
    } catch (error) {
      // Record failure metrics
      mqMessageConsumed.inc({ queue, status: 'error' });
      
      this.logger.error(
        `Failed to process MQ message on ${queue}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      // Use the channel that received this message for nack
      try {
        messageChannel.nack(message, false, true);
      } catch (nackError) {
        this.logger.error(
          `Failed to nack message ${message.properties.messageId}: ${
            nackError instanceof Error ? nackError.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  private async getPublishChannel(): Promise<Channel> {
    if (this.publishChannel) {
      return this.publishChannel;
    }

    const connection = await this.getConnection();
    const channel = await connection.createChannel();

    // Handle channel errors
    channel.on('error', (error) => {
      this.logger.error(`RabbitMQ publish channel error: ${error.message}`);
      this.publishChannel = null;
    });

    channel.on('close', () => {
      this.logger.warn('RabbitMQ publish channel closed');
      this.publishChannel = null;
    });

    this.publishChannel = channel;
    return channel;
  }

  private async getConsumeChannel(): Promise<Channel> {
    if (this.consumeChannel) {
      return this.consumeChannel;
    }

    const connection = await this.getConnection();
    const channel = await connection.createChannel();

    // Handle channel errors
    channel.on('error', (error) => {
      this.logger.error(`RabbitMQ consume channel error: ${error.message}`);
      this.consumeChannel = null;
      // Trigger reconnection
      void this.reconnectConsumers();
    });

    channel.on('close', () => {
      this.logger.warn('RabbitMQ consume channel closed');
      this.consumeChannel = null;
      // Trigger reconnection
      void this.reconnectConsumers();
    });

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

  private async reconnectConsumers(): Promise<void> {
    if (this.isReconnecting) {
      this.logger.debug('Reconnection already in progress, skipping');
      return;
    }

    if (this.consumerRegistry.length === 0) {
      this.logger.debug('No consumers registered, skipping reconnection');
      return;
    }

    this.isReconnecting = true;
    this.logger.log(`Attempting to reconnect ${this.consumerRegistry.length} consumers...`);

    let attempt = 0;
    const maxAttempts = 10;
    const baseDelay = 1000; // 1 second

    while (attempt < maxAttempts) {
      try {
        attempt++;

        // Wait before retry (exponential backoff with max 30s)
        if (attempt > 1) {
          const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
          this.logger.log(`Reconnection attempt ${attempt}/${maxAttempts} in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        // Force channel recreation
        this.consumeChannel = null;

        // Re-register all consumers
        for (const consumer of this.consumerRegistry) {
          const channel = await this.getConsumeChannel();
          await channel.assertQueue(consumer.queue, { durable: true });
          await channel.prefetch(mqConfig.prefetchCount);
          await channel.consume(
            consumer.queue,
            async (message) => {
              if (!message) {
                return;
              }
              await this.handleMessage(consumer.queue, channel, message, consumer.handler);
            },
            { noAck: false },
          );
          this.logger.log(`Reconnected consumer for queue: ${consumer.queue}`);
        }

        this.logger.log('All consumers reconnected successfully');
        this.isReconnecting = false;
        return;
      } catch (error) {
        this.logger.error(
          `Reconnection attempt ${attempt}/${maxAttempts} failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );

        if (attempt >= maxAttempts) {
          this.logger.error('Max reconnection attempts reached, giving up');
          this.isReconnecting = false;
          return;
        }
      }
    }
  }
}
