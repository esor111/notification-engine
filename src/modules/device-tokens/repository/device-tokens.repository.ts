import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { DeviceTokenEntity } from '../entity/device-token.entity';

@Injectable()
export class DeviceTokensRepository {
  constructor(
    @InjectRepository(DeviceTokenEntity)
    private readonly repo: Repository<DeviceTokenEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<DeviceTokenEntity> {
    return manager ? manager.getRepository(DeviceTokenEntity) : this.repo;
  }

  async findByUserId(userId: string): Promise<DeviceTokenEntity[]> {
    return this.repo.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }

  async findActiveByUserId(userId: string, manager?: EntityManager): Promise<DeviceTokenEntity[]> {
    return this.getRepository(manager).find({ where: { userId, isActive: true } });
  }

  async upsert(
    data: { userId: string; token: string; platform: string },
    manager?: EntityManager,
  ): Promise<DeviceTokenEntity> {
    const repository = this.getRepository(manager);
    const existing = await repository.findOne({ where: { token: data.token } });
    if (existing) {
      existing.userId = data.userId;
      existing.platform = data.platform;
      existing.isActive = true;
      return repository.save(existing);
    }

    const entity = repository.create({
      userId: data.userId,
      token: data.token,
      platform: data.platform,
      isActive: true,
      lastUsedAt: null,
    });
    return repository.save(entity);
  }

  async markUsed(tokens: string[], manager?: EntityManager): Promise<void> {
    if (tokens.length === 0) {
      return;
    }

    await this.getRepository(manager)
      .createQueryBuilder()
      .update(DeviceTokenEntity)
      .set({ lastUsedAt: () => 'now()' })
      .where('token IN (:...tokens)', { tokens })
      .execute();
  }
}
