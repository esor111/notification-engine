import { ApiProperty } from '@nestjs/swagger';

export class NotificationOutboxEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  eventType!: string;

  @ApiProperty()
  aggregateType!: string;

  @ApiProperty()
  aggregateId!: string;

  @ApiProperty()
  queue!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  attempts!: number;

  @ApiProperty({ nullable: true })
  lastError!: string | null;

  @ApiProperty({ format: 'date-time' })
  occurredAt!: string;

  @ApiProperty({ format: 'date-time' })
  availableAt!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  dispatchedAt!: string | null;
}
