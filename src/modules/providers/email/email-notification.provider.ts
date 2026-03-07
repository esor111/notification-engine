import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailNotificationProvider {
  private readonly logger = new Logger(EmailNotificationProvider.name);

  async send(message: {
    to: string;
    subject: string;
    body: string;
  }): Promise<{ provider: string; providerMessageId: string }> {
    const providerMessageId = `email-${Date.now()}`;
    this.logger.log(`Email queued to ${message.to}: ${message.subject}`);

    return {
      provider: 'console-email',
      providerMessageId,
    };
  }
}
