import { UserCreatedEvent } from '../../../modules/users/events/user-created.event';

export const USER_CREATED_PUBLISHER = Symbol('USER_CREATED_PUBLISHER');

export interface UserCreatedPublisher {
  publish(event: UserCreatedEvent): Promise<void>;
}
