import { ApiProperty } from '@nestjs/swagger';

export class NotificationLogDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  notificationId!: string;

  @ApiProperty()
  event!: string;

  @ApiProperty({ type: 'object', additionalProperties: true, nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ format: 'date-time' })
  timestamp!: string;
}
