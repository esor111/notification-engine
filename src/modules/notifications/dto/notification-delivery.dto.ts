import { ApiProperty } from '@nestjs/swagger';

export class NotificationDeliveryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  notificationId!: string;

  @ApiProperty()
  channel!: string;

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  retryCount!: number;

  @ApiProperty({ nullable: true })
  errorMessage!: string | null;

  @ApiProperty({ nullable: true })
  providerMessageId!: string | null;

  @ApiProperty({ nullable: true })
  sentAt!: string | null;

  @ApiProperty({ nullable: true })
  deliveredAt!: string | null;
}
