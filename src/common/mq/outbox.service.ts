import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { OutboxEventEntity } from './entities/outbox-event.entity';

export type EnqueueOutboxEvent = {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  queue: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class OutboxService {
  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepository: Repository<OutboxEventEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<OutboxEventEntity> {
    return manager ? manager.getRepository(OutboxEventEntity) : this.outboxRepository;
  }

  async enqueue(event: EnqueueOutboxEvent, manager?: EntityManager): Promise<void> {
    const repository = this.getRepository(manager);
    const outboxEvent = repository.create({
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId,
      queue: event.queue,
      dedupeKey: event.dedupeKey,
      payload: event.payload,
      status: 'pending',
      attempts: 0,
      lastError: null,
      availableAt: new Date(),
      dispatchedAt: null,
    });

    await repository.save(outboxEvent);
  }

  async claimPendingBatch(limit: number): Promise<OutboxEventEntity[]> {
    const events = await this.outboxRepository.find({
      where: [
        { status: 'pending', availableAt: LessThanOrEqual(new Date()) },
        { status: 'failed', availableAt: LessThanOrEqual(new Date()) },
      ],
      order: { occurredAt: 'ASC' },
      take: limit,
    });

    if (events.length === 0) {
      return [];
    }

    const claimed: OutboxEventEntity[] = [];
    for (const event of events) {
      const result = await this.outboxRepository.update(
        { id: event.id, status: event.status },
        { status: 'processing', attempts: event.attempts + 1, lastError: null },
      );

      if (result.affected === 1) {
        claimed.push({ ...event, status: 'processing', attempts: event.attempts + 1 });
      }
    }

    return claimed;
  }

  async markDispatched(eventId: string): Promise<void> {
    await this.outboxRepository.update(
      { id: eventId },
      { status: 'dispatched', dispatchedAt: new Date(), lastError: null },
    );
  }

  async markFailed(eventId: string, attempts: number, errorMessage: string): Promise<void> {
    const retryDelayMs = Math.min(30000, 1000 * Math.max(attempts, 1));
    await this.outboxRepository.update(
      { id: eventId },
      {
        status: 'failed',
        lastError: errorMessage,
        availableAt: new Date(Date.now() + retryDelayMs),
      },
    );
  }
}
