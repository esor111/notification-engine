import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { NotificationPreferenceDto } from '../dto/notification-preference.dto';
import { UpsertNotificationPreferenceDto } from '../dto/upsert-notification-preference.dto';
import { NotificationPreferencesService } from '../service/notification-preferences.service';

@ApiTags('Notification Preferences')
@ApiBearerAuth('access-token')
@Controller('notification-preferences')
export class NotificationPreferencesController {
  constructor(private readonly preferencesService: NotificationPreferencesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listNotificationPreferences',
    summary: 'List current user notification preferences',
  })
  @ApiOkResponse({ type: NotificationPreferenceDto, isArray: true })
  list(@CurrentUser() user: AuthenticatedUser): Promise<NotificationPreferenceDto[]> {
    return this.preferencesService.list(user.sub);
  }

  @Post()
  @ApiOperation({
    operationId: 'upsertNotificationPreference',
    summary: 'Create or update a notification preference',
  })
  @ApiOkResponse({ type: NotificationPreferenceDto })
  upsert(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertNotificationPreferenceDto,
  ): Promise<NotificationPreferenceDto> {
    return this.preferencesService.upsert(user.sub, dto);
  }
}
