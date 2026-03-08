import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AuditService } from '../../../common/audit/audit.service';
import { NotificationTemplateDto } from '../dto/notification-template.dto';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';
import { NotificationTemplatesRepository } from '../repository/notification-templates.repository';
import { NotificationTemplateEntity } from '../entity/notification-template.entity';

function toDto(entity: NotificationTemplateEntity): NotificationTemplateDto {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    titleTemplate: entity.titleTemplate,
    bodyTemplate: entity.bodyTemplate,
    variablesSchema: entity.variablesSchema,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

@Injectable()
export class NotificationTemplatesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly templatesRepository: NotificationTemplatesRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateNotificationTemplateDto,
    actorUserId?: string,
  ): Promise<NotificationTemplateDto> {
    const template = await this.dataSource.transaction(async (manager) => {
      const existing = await this.templatesRepository.findByName(dto.name, manager);
      if (existing) {
        throw new ConflictException('A notification template with this name already exists');
      }

      const createdTemplate = await this.templatesRepository.createAndSave(dto, manager);
      await this.auditService.log(
        {
          actorUserId,
          action: 'notification_template.created',
          resourceType: 'notification_template',
          resourceId: createdTemplate.id,
          metadata: {
            name: createdTemplate.name,
            channel: createdTemplate.channel,
          },
        },
        manager,
      );

      return createdTemplate;
    });

    return toDto(template);
  }

  async list(): Promise<NotificationTemplateDto[]> {
    const templates = await this.templatesRepository.findAll();
    return templates.map(toDto);
  }

  async findEntityByName(name: string): Promise<NotificationTemplateEntity | null> {
    return this.templatesRepository.findByName(name);
  }

  async getOrThrow(id: string): Promise<NotificationTemplateEntity> {
    const template = await this.templatesRepository.findById(id);
    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    return template;
  }
}
