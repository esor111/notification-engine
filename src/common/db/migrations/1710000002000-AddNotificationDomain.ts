import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationDomain1710000002000 implements MigrationInterface {
  name = 'AddNotificationDomain1710000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_templates (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(100) NOT NULL UNIQUE,
        channel varchar(20) NOT NULL,
        title_template varchar(255) NOT NULL,
        body_template text NOT NULL,
        variables_schema jsonb NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        template_id uuid NOT NULL REFERENCES notification_templates(id) ON DELETE RESTRICT,
        event_type varchar(100) NOT NULL,
        data jsonb NOT NULL,
        status varchar(32) NOT NULL,
        priority varchar(16) NOT NULL DEFAULT 'normal',
        dedupe_key varchar(255) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(),
        scheduled_at timestamptz NULL,
        processed_at timestamptz NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created
      ON notifications (user_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_deliveries (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        channel varchar(20) NOT NULL,
        provider varchar(100) NOT NULL,
        status varchar(32) NOT NULL,
        retry_count integer NOT NULL DEFAULT 0,
        error_message text NULL,
        provider_message_id varchar(255) NULL,
        sent_at timestamptz NULL,
        delivered_at timestamptz NULL,
        last_attempt_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification
      ON notification_deliveries (notification_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_notification_preferences (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        notification_type varchar(100) NOT NULL,
        channel varchar(20) NOT NULL,
        enabled boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_user_notification_preference UNIQUE (user_id, notification_type, channel)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS device_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token varchar(255) NOT NULL UNIQUE,
        platform varchar(20) NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        last_used_at timestamptz NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user_active
      ON device_tokens (user_id, is_active);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS notification_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
        event varchar(50) NOT NULL,
        timestamp timestamptz NOT NULL DEFAULT now(),
        metadata jsonb NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_timestamp
      ON notification_logs (notification_id, timestamp DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS notification_logs;');
    await queryRunner.query('DROP TABLE IF EXISTS device_tokens;');
    await queryRunner.query('DROP TABLE IF EXISTS user_notification_preferences;');
    await queryRunner.query('DROP TABLE IF EXISTS notification_deliveries;');
    await queryRunner.query('DROP TABLE IF EXISTS notifications;');
    await queryRunner.query('DROP TABLE IF EXISTS notification_templates;');
  }
}
