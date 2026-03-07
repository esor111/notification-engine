import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type NotificationDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'skipped'
  | 'failed'
  | 'dead_lettered';

@Entity({ name: 'notification_deliveries' })
export class NotificationDeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  @Column({ type: 'varchar', length: 20 })
  channel!: string;

  @Column({ type: 'varchar', length: 100 })
  provider!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: NotificationDeliveryStatus;

  @Column({ name: 'retry_count', type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ name: 'provider_message_id', type: 'varchar', length: 255, nullable: true })
  providerMessageId!: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ name: 'last_attempt_at', type: 'timestamptz', nullable: true })
  lastAttemptAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
