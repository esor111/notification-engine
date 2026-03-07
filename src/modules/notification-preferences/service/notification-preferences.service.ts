import { Injectable } from '@nestjs/common';
import { NotificationPreferenceDto } from '../dto/notification-preference.dto';
import { UpsertNotificationPreferenceDto } from '../dto/upsert-notification-preference.dto';
import { NotificationPreferencesRepository } from '../repository/notification-preferences.repository';
import { UserNotificationPreferenceEntity } from '../entity/user-notification-preference.entity';

function toDto(entity: UserNotificationPreferenceEntity): NotificationPreferenceDto {
  return {
    id: entity.id,
    userId: entity.userId,
    notificationType: entity.notificationType,
    channel: entity.channel,
    enabled: entity.enabled,
  };
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private readonly preferencesRepository: NotificationPreferencesRepository) {}

  async upsert(
    userId: string,
    dto: UpsertNotificationPreferenceDto,
  ): Promise<NotificationPreferenceDto> {
    const preference = await this.preferencesRepository.upsert({
      userId,
      notificationType: dto.notificationType,
      channel: dto.channel,
      enabled: dto.enabled,
    });

    return toDto(preference);
  }

  async list(userId: string): Promise<NotificationPreferenceDto[]> {
    const preferences = await this.preferencesRepository.findByUserId(userId);
    return preferences.map(toDto);
  }
}
