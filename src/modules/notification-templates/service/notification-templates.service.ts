import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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
  constructor(private readonly templatesRepository: NotificationTemplatesRepository) {}

  async create(dto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    const existing = await this.templatesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException('A notification template with this name already exists');
    }

    const template = await this.templatesRepository.createAndSave(dto);
    return toDto(template);
  }

  async list(): Promise<NotificationTemplateDto[]> {
    const templates = await this.templatesRepository.findAll();
    return templates.map(toDto);
  }

  async getOrThrow(id: string): Promise<NotificationTemplateEntity> {
    const template = await this.templatesRepository.findById(id);
    if (!template) {
      throw new NotFoundException('Notification template not found');
    }

    return template;
  }
}
