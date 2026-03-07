import { Injectable, Logger } from '@nestjs/common';
import { UserCreatedPublisher } from './user-created.publisher';
import { UserCreatedEvent } from '../../../modules/users/events/user-created.event';

@Injectable()
export class LogUserCreatedPublisher implements UserCreatedPublisher {
  private readonly logger = new Logger(LogUserCreatedPublisher.name);

  async publish(event: UserCreatedEvent): Promise<void> {
    this.logger.log(`user.created event queued for user=${event.userId} email=${event.email}`);
  }
}
