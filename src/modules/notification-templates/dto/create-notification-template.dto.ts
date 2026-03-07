import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ enum: ['email', 'sms', 'push'] })
  @IsString()
  @IsIn(['email', 'sms', 'push'])
  channel!: 'email' | 'sms' | 'push';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titleTemplate!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;

  @ApiProperty({ required: false, type: Object, additionalProperties: true })
  @IsOptional()
  @IsObject()
  variablesSchema?: Record<string, unknown>;
}
