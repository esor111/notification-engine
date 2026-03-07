import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersTable1710000000000 implements MigrationInterface {
  name = 'CreateUsersTable1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        full_name varchar(255) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type varchar(255) NOT NULL,
        aggregate_type varchar(255) NOT NULL,
        aggregate_id varchar(255) NOT NULL,
        queue varchar(255) NOT NULL,
        dedupe_key varchar(255) NOT NULL UNIQUE,
        payload jsonb NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'pending',
        attempts integer NOT NULL DEFAULT 0,
        last_error text NULL,
        occurred_at timestamptz NOT NULL DEFAULT now(),
        available_at timestamptz NOT NULL DEFAULT now(),
        dispatched_at timestamptz NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_outbox_events_pending
      ON outbox_events (status, available_at, occurred_at);
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS processed_messages (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        consumer_name varchar(255) NOT NULL,
        message_id varchar(255) NOT NULL,
        processed_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_processed_messages_consumer_message UNIQUE (consumer_name, message_id)
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS processed_messages;');
    await queryRunner.query('DROP TABLE IF EXISTS outbox_events;');
    await queryRunner.query('DROP TABLE IF EXISTS users;');
  }
}
