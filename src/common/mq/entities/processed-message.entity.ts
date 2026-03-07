import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'processed_messages' })
@Unique('uq_processed_messages_consumer_message', ['consumerName', 'messageId'])
export class ProcessedMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'consumer_name', type: 'varchar', length: 255 })
  consumerName!: string;

  @Column({ name: 'message_id', type: 'varchar', length: 255 })
  messageId!: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt!: Date;
}
