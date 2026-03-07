import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsString, MaxLength } from 'class-validator';

export class UpsertNotificationPreferenceDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  notificationType!: string;

  @ApiProperty({ enum: ['email', 'sms', 'push'] })
  @IsString()
  @IsIn(['email', 'sms', 'push'])
  channel!: 'email' | 'sms' | 'push';

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
