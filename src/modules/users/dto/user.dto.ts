import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from '../entity/user.entity';

export class UserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'John Doe' })
  fullName!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export function toUserDto(entity: UserEntity): UserDto {
  return {
    id: entity.id,
    email: entity.email,
    fullName: entity.fullName,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
