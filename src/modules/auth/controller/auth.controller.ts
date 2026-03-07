import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { Public } from '../../../common/auth/public.decorator';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { UserDto } from '../../users/dto/user.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../service/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiCreatedResponse({ type: AuthResponseDto })
  register(
    @Body() dto: RegisterDto,
    @Req() req: { headers: Record<string, string | undefined>; ip?: string },
  ) {
    return this.authService.register(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  login(
    @Body() dto: LoginDto,
    @Req() req: { headers: Record<string, string | undefined>; ip?: string },
  ) {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: { headers: Record<string, string | undefined>; ip?: string },
  ) {
    return this.authService.refresh(dto.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Body() dto: RefreshTokenDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: UserDto })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.authService.me(user.sub);
  }
}
