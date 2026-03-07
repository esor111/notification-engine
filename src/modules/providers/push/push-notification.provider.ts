import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushNotificationProvider {
  private readonly logger = new Logger(PushNotificationProvider.name);

  async send(message: {
    tokens: string[];
    title: string;
    body: string;
    data: Record<string, unknown>;
  }): Promise<{ provider: string; providerMessageId: string }> {
    const providerMessageId = `push-${Date.now()}`;
    this.logger.log(`Push queued to ${message.tokens.length} devices: ${message.title}`);

    return {
      provider: 'console-push',
      providerMessageId,
    };
  }
}
