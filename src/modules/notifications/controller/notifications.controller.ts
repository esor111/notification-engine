import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { NotificationDeliveryDto } from '../dto/notification-delivery.dto';
import { NotificationLogDto } from '../dto/notification-log.dto';
import { NotificationDto } from '../dto/notification.dto';
import { NotificationsService } from '../service/notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ operationId: 'listNotifications', summary: 'List current user notifications' })
  @ApiOkResponse({ type: NotificationDto, isArray: true })
  listMine(@CurrentUser() user: AuthenticatedUser): Promise<NotificationDto[]> {
    return this.notificationsService.listForUser(user.sub);
  }

  @Post()
  @ApiOperation({ operationId: 'createNotification', summary: 'Queue a notification' })
  @ApiCreatedResponse({ type: NotificationDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNotificationDto,
  ): Promise<NotificationDto> {
    return this.notificationsService.create(user.sub, dto);
  }

  @Get(':id/deliveries')
  @ApiOperation({
    operationId: 'getNotificationDeliveries',
    summary: 'List delivery attempts for a notification',
  })
  @ApiOkResponse({ type: NotificationDeliveryDto, isArray: true })
  getDeliveries(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationDeliveryDto[]> {
    return this.notificationsService.getDeliveriesForUser(user.sub, id);
  }

  @Get(':id/logs')
  @ApiOperation({
    operationId: 'getNotificationLogs',
    summary: 'List lifecycle log entries for a notification',
  })
  @ApiOkResponse({ type: NotificationLogDto, isArray: true })
  getLogs(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<NotificationLogDto[]> {
    return this.notificationsService.getLogsForUser(user.sub, id);
  }
}
