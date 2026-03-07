import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty({ format: 'uuid' })
  templateId!: string;

  @ApiProperty()
  eventType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  data!: Record<string, unknown>;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  dedupeKey!: string;

  @ApiProperty({ nullable: true })
  scheduledAt!: string | null;

  @ApiProperty({ nullable: true })
  processedAt!: string | null;

  @ApiProperty()
  createdAt!: string;
}
