import { Injectable } from '@nestjs/common';
import { DeviceTokenDto } from '../dto/device-token.dto';
import { RegisterDeviceTokenDto } from '../dto/register-device-token.dto';
import { DeviceTokensRepository } from '../repository/device-tokens.repository';
import { DeviceTokenEntity } from '../entity/device-token.entity';

function toDto(entity: DeviceTokenEntity): DeviceTokenDto {
  return {
    id: entity.id,
    userId: entity.userId,
    token: entity.token,
    platform: entity.platform,
    isActive: entity.isActive,
    lastUsedAt: entity.lastUsedAt ? entity.lastUsedAt.toISOString() : null,
  };
}

@Injectable()
export class DeviceTokensService {
  constructor(private readonly deviceTokensRepository: DeviceTokensRepository) {}

  async register(userId: string, dto: RegisterDeviceTokenDto): Promise<DeviceTokenDto> {
    const token = await this.deviceTokensRepository.upsert({
      userId,
      token: dto.token,
      platform: dto.platform,
    });

    return toDto(token);
  }

  async list(userId: string): Promise<DeviceTokenDto[]> {
    const tokens = await this.deviceTokensRepository.findByUserId(userId);
    return tokens.map(toDto);
  }
}
