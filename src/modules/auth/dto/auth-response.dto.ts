import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../users/dto/user.dto';

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthResponseDto extends AuthTokensDto {
  @ApiProperty({ type: UserDto })
  user!: UserDto;
}
