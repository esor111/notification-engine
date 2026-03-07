import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type NotificationChannel = 'email' | 'sms' | 'push';

@Entity({ name: 'notification_templates' })
export class NotificationTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'varchar', length: 20 })
  channel!: NotificationChannel;

  @Column({ name: 'title_template', type: 'varchar', length: 255 })
  titleTemplate!: string;

  @Column({ name: 'body_template', type: 'text' })
  bodyTemplate!: string;

  @Column({ name: 'variables_schema', type: 'jsonb', nullable: true })
  variablesSchema!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
