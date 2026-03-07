import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { NotificationTemplateEntity } from '../entity/notification-template.entity';
import { CreateNotificationTemplateDto } from '../dto/create-notification-template.dto';

@Injectable()
export class NotificationTemplatesRepository {
  constructor(
    @InjectRepository(NotificationTemplateEntity)
    private readonly repo: Repository<NotificationTemplateEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<NotificationTemplateEntity> {
    return manager ? manager.getRepository(NotificationTemplateEntity) : this.repo;
  }

  async findAll(): Promise<NotificationTemplateEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string, manager?: EntityManager): Promise<NotificationTemplateEntity | null> {
    return this.getRepository(manager).findOne({ where: { id } });
  }

  async findByName(
    name: string,
    manager?: EntityManager,
  ): Promise<NotificationTemplateEntity | null> {
    return this.getRepository(manager).findOne({ where: { name } });
  }

  async createAndSave(
    dto: CreateNotificationTemplateDto,
    manager?: EntityManager,
  ): Promise<NotificationTemplateEntity> {
    const repository = this.getRepository(manager);
    const entity = repository.create({
      name: dto.name,
      channel: dto.channel,
      titleTemplate: dto.titleTemplate,
      bodyTemplate: dto.bodyTemplate,
      variablesSchema: dto.variablesSchema ?? null,
    });
    return repository.save(entity);
  }
}
