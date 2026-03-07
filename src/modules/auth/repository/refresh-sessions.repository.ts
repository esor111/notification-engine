import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshSessionEntity } from '../entity/refresh-session.entity';

@Injectable()
export class RefreshSessionsRepository {
  constructor(
    @InjectRepository(RefreshSessionEntity)
    private readonly repo: Repository<RefreshSessionEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<RefreshSessionEntity> {
    return manager ? manager.getRepository(RefreshSessionEntity) : this.repo;
  }

  async createAndSave(
    data: {
      id?: string;
      userId: string;
      tokenHash: string;
      expiresAt: Date;
      userAgent?: string;
      ipAddress?: string;
    },
    manager?: EntityManager,
  ): Promise<RefreshSessionEntity> {
    const repository = this.getRepository(manager);
    const session = repository.create({
      id: data.id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      revokedAt: null,
      userAgent: data.userAgent ?? null,
      ipAddress: data.ipAddress ?? null,
    });
    return repository.save(session);
  }

  async findActiveById(id: string, manager?: EntityManager): Promise<RefreshSessionEntity | null> {
    return this.getRepository(manager).findOne({
      where: {
        id,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async revoke(id: string, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).update({ id }, { revokedAt: new Date() });
  }
}
