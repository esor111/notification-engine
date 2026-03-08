import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/auth/roles.decorator';
import { DeadLetteredNotificationDto } from '../dto/dead-lettered-notification.dto';
import { ListOutboxEventsQueryDto } from '../dto/list-outbox-events-query.dto';
import { NotificationOutboxEventDto } from '../dto/notification-outbox-event.dto';
import { NotificationOperationsService } from '../service/notification-operations.service';

@ApiTags('Notification Operations')
@ApiBearerAuth('access-token')
@ApiForbiddenResponse({ description: 'Admin role required' })
@Roles('admin')
@Controller('notification-ops')
export class NotificationOperationsController {
  constructor(private readonly notificationOperationsService: NotificationOperationsService) {}

  @Get('outbox')
  @ApiOperation({
    operationId: 'listNotificationOutboxEvents',
    summary: 'List notification-related outbox events',
  })
  @ApiOkResponse({ type: NotificationOutboxEventDto, isArray: true })
  listOutbox(@Query() query: ListOutboxEventsQueryDto): Promise<NotificationOutboxEventDto[]> {
    return this.notificationOperationsService.listOutboxEvents(query);
  }

  @Get('dead-lettered')
  @ApiOperation({
    operationId: 'listDeadLetteredNotifications',
    summary: 'List dead-lettered notifications',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100 },
  })
  @ApiOkResponse({ type: DeadLetteredNotificationDto, isArray: true })
  listDeadLettered(@Query('limit') limit?: string): Promise<DeadLetteredNotificationDto[]> {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.notificationOperationsService.listDeadLetteredNotifications(parsedLimit ?? 50);
  }
}
