import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength } from 'class-validator';

export class RegisterDeviceTokenDto {
  @ApiProperty()
  @IsString()
  @MaxLength(255)
  token!: string;

  @ApiProperty({ enum: ['ios', 'android', 'web'] })
  @IsString()
  @IsIn(['ios', 'android', 'web'])
  platform!: 'ios' | 'android' | 'web';
}
