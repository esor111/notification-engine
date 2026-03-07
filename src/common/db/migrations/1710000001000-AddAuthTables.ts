import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthTables1710000001000 implements MigrationInterface {
  name = 'AddAuthTables1710000001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS local_credentials (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        password_hash varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(255) NOT NULL UNIQUE,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz NULL,
        user_agent varchar(255) NULL,
        ip_address varchar(64) NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_refresh_sessions_user_active
      ON refresh_sessions (user_id, revoked_at, expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS refresh_sessions;');
    await queryRunner.query('DROP TABLE IF EXISTS local_credentials;');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS is_active;');
  }
}
