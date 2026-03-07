import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuditLogs1710000004000 implements MigrationInterface {
  name = 'CreateAuditLogs1710000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
        action varchar(100) NOT NULL,
        resource_type varchar(100) NOT NULL,
        resource_id varchar(255) NULL,
        metadata jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
      ON audit_logs (resource_type, resource_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_audit_logs_resource;');
    await queryRunner.query('DROP INDEX IF EXISTS idx_audit_logs_created_at;');
    await queryRunner.query('DROP TABLE IF EXISTS audit_logs;');
  }
}
