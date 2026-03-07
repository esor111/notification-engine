import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type NotificationStatus =
  | 'pending'
  | 'processing'
  | 'sent'
  | 'skipped'
  | 'retrying'
  | 'failed'
  | 'dead_lettered';
export type NotificationPriority = 'critical' | 'normal' | 'bulk';

@Entity({ name: 'notifications' })
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 32 })
  status!: NotificationStatus;

  @Column({ type: 'varchar', length: 16, default: 'normal' })
  priority!: NotificationPriority;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 255, unique: true })
  dedupeKey!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
