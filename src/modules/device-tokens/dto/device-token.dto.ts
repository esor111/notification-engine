import { ApiProperty } from '@nestjs/swagger';

export class DeviceTokenDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiProperty()
  token!: string;

  @ApiProperty()
  platform!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  lastUsedAt!: string | null;
}
