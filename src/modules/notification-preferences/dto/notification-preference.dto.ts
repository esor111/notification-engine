import { ApiProperty } from '@nestjs/swagger';

export class NotificationPreferenceDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  notificationType!: string;

  @ApiProperty()
  channel!: string;

  @ApiProperty()
  enabled!: boolean;
}
