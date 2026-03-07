import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpsertNotificationPreferenceDto {
  @ApiProperty()
  notificationType!: string;

  @ApiProperty({ enum: ['email', 'sms', 'push'] })
  channel!: 'email' | 'sms' | 'push';

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
