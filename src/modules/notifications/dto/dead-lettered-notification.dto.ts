import { ApiProperty } from '@nestjs/swagger';

export class DeadLetteredNotificationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  @ApiProperty()
  eventType!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  dedupeKey!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  data!: Record<string, unknown>;

  @ApiProperty({ nullable: true })
  channel!: string | null;

  @ApiProperty({ nullable: true })
  provider!: string | null;

  @ApiProperty({ nullable: true })
  lastError!: string | null;

  @ApiProperty({ nullable: true, format: 'date-time' })
  lastAttemptAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
