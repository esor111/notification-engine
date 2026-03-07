import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotificationDto {
  @ApiProperty({ format: 'uuid' })
  @IsString()
  templateId!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  eventType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  @IsObject()
  data!: Record<string, unknown>;

  @ApiProperty({ enum: ['critical', 'normal', 'bulk'], required: false })
  @IsOptional()
  @IsString()
  @IsIn(['critical', 'normal', 'bulk'])
  priority?: 'critical' | 'normal' | 'bulk';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  dedupeKey?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
