import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { LocalCredentialEntity } from '../entity/local-credential.entity';

@Injectable()
export class LocalCredentialsRepository {
  constructor(
    @InjectRepository(LocalCredentialEntity)
    private readonly repo: Repository<LocalCredentialEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<LocalCredentialEntity> {
    return manager ? manager.getRepository(LocalCredentialEntity) : this.repo;
  }

  async findByUserId(
    userId: string,
    manager?: EntityManager,
  ): Promise<LocalCredentialEntity | null> {
    return this.getRepository(manager).findOne({ where: { userId } });
  }

  async createAndSave(
    userId: string,
    passwordHash: string,
    manager?: EntityManager,
  ): Promise<LocalCredentialEntity> {
    const repository = this.getRepository(manager);
    const credential = repository.create({ userId, passwordHash });
    return repository.save(credential);
  }
}
