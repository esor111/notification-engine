import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { AuditLogEntity } from './entity/audit-log.entity';

export type AuditLogEntry = {
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
};

@Injectable()
export class AuditService {
  constructor(private readonly dataSource: DataSource) {}

  async log(entry: AuditLogEntry, manager?: EntityManager): Promise<AuditLogEntity> {
    const repository = this.getRepository(manager);
    const auditLog = repository.create({
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
    });

    return repository.save(auditLog);
  }

  private getRepository(manager?: EntityManager): Repository<AuditLogEntity> {
    return manager
      ? manager.getRepository(AuditLogEntity)
      : this.dataSource.getRepository(AuditLogEntity);
  }
}
