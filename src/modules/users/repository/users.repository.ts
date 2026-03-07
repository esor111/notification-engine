import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../entity/user.entity';
import { UserRole } from '../user-role';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<UserEntity> {
    return manager ? manager.getRepository(UserEntity) : this.repo;
  }

  async findById(id: string, manager?: EntityManager): Promise<UserEntity | null> {
    return this.getRepository(manager).findOne({ where: { id } });
  }

  async findByEmail(email: string, manager?: EntityManager): Promise<UserEntity | null> {
    return this.getRepository(manager).findOne({ where: { email } });
  }

  async findAll(): Promise<UserEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async createAndSave(dto: CreateUserDto, manager?: EntityManager): Promise<UserEntity> {
    const repository = this.getRepository(manager);
    const entity = repository.create({
      email: dto.email,
      fullName: dto.fullName,
      isActive: true,
      role: 'user',
    });
    return repository.save(entity);
  }

  async updateRole(id: string, role: UserRole, manager?: EntityManager): Promise<void> {
    await this.getRepository(manager).update({ id }, { role });
  }
}
