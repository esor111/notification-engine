import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type OutboxEventStatus = 'pending' | 'processing' | 'dispatched' | 'failed';

@Entity({ name: 'outbox_events' })
export class OutboxEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 255 })
  eventType!: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 255 })
  aggregateType!: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 })
  aggregateId!: string;

  @Column({ name: 'queue', type: 'varchar', length: 255 })
  queue!: string;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 255, unique: true })
  dedupeKey!: string;

  @Column({ name: 'payload', type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ name: 'status', type: 'varchar', length: 32, default: 'pending' })
  status!: OutboxEventStatus;

  @Column({ name: 'attempts', type: 'integer', default: 0 })
  attempts!: number;

  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError!: string | null;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'available_at', type: 'timestamptz', default: () => 'now()' })
  availableAt!: Date;

  @Column({ name: 'dispatched_at', type: 'timestamptz', nullable: true })
  dispatchedAt!: Date | null;
}
