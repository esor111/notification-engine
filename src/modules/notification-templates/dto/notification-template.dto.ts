import { ApiProperty } from '@nestjs/swagger';

export class NotificationTemplateDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['email', 'sms', 'push'] })
  channel!: string;

  @ApiProperty()
  titleTemplate!: string;

  @ApiProperty()
  bodyTemplate!: string;

  @ApiProperty({ required: false, type: Object, additionalProperties: true, nullable: true })
  variablesSchema!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
