import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoles1710000003000 implements MigrationInterface {
  name = 'AddUserRoles1710000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role varchar(32) NOT NULL DEFAULT 'user';
    `);

    await queryRunner.query(`
      UPDATE users
      SET role = 'user'
      WHERE role IS NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role
      ON users (role);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_users_role;');
    await queryRunner.query('ALTER TABLE users DROP COLUMN IF EXISTS role;');
  }
}
