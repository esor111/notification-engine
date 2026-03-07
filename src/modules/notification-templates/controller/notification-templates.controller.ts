import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../../../common/auth/authenticated-user.interface';
import { CurrentUser } from '../../../common/auth/current-user.decorator';
import { Roles } from '../../../common/auth/roles.decorator';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { NotificationTemplateDto } from '../dto/notification-template.dto';
import { NotificationTemplatesService } from '../service/notification-templates.service';

@ApiTags('Notification Templates')
@ApiBearerAuth('access-token')
@ApiForbiddenResponse({ description: 'Admin role required' })
@Roles('admin')
@Controller('notification-templates')
export class NotificationTemplatesController {
  constructor(private readonly templatesService: NotificationTemplatesService) {}

  @Get()
  @ApiOperation({
    operationId: 'listNotificationTemplates',
    summary: 'List notification templates',
  })
  @ApiOkResponse({ type: NotificationTemplateDto, isArray: true })
  list(): Promise<NotificationTemplateDto[]> {
    return this.templatesService.list();
  }

  @Post()
  @ApiOperation({
    operationId: 'createNotificationTemplate',
    summary: 'Create a notification template',
  })
  @ApiCreatedResponse({ type: NotificationTemplateDto })
  @ApiConflictResponse({ description: 'Template name already exists' })
  create(
    @Body() dto: CreateNotificationTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<NotificationTemplateDto> {
    return this.templatesService.create(dto, user.sub);
  }
}
