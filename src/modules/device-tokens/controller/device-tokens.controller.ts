import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { DeviceTokenDto } from '../dto/device-token.dto';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';
import { DeviceTokensService } from '../service/device-tokens.service';

@ApiTags('Device Tokens')
@ApiBearerAuth('access-token')
@Controller('device-tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Get()
  @ApiOperation({ operationId: 'listDeviceTokens', summary: 'List current user device tokens' })
  @ApiOkResponse({ type: DeviceTokenDto, isArray: true })
  list(@CurrentUser() user: AuthenticatedUser): Promise<DeviceTokenDto[]> {
    return this.deviceTokensService.list(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    operationId: 'registerDeviceToken',
    summary: 'Register a device token for push notifications',
  })
  @ApiOkResponse({ type: DeviceTokenDto })
  register(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenDto> {
    return this.deviceTokensService.register(user.sub, dto);
  }
}
