export type PublishableMessage = {
  messageId: string;
  eventType: string;
  queue: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
};

export const MQ_MESSAGE_PUBLISHER = Symbol('MQ_MESSAGE_PUBLISHER');

export interface MqMessagePublisher {
  publish(message: PublishableMessage): Promise<void>;
}
