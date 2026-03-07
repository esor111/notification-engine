import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'notification_logs' })
export class NotificationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'notification_id', type: 'uuid' })
  notificationId!: string;

  @Column({ type: 'varchar', length: 50 })
  event!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'timestamp', type: 'timestamptz' })
  timestamp!: Date;
}
