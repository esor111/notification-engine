# Backend API Starter (Agent-Friendly)

This is a NestJS-first backend scaffold designed for predictable, autonomous development.

## Stack
- NestJS
- PostgreSQL + TypeORM
- Swagger/OpenAPI
- RabbitMQ (MQ)
- Grafana + Loki + Prometheus

## Quick Start
1. Copy environment file: `.env.example` -> `.env`
2. Start infrastructure: `docker compose -f docker-compose.dev.yml up -d`
3. Install packages: `npm install`
4. Run migrations: `npm run db:migrate`
5. Run app: `npm run start:dev`
6. Verify quality gate: `npm run verify`

## Available Endpoints
- `GET /health`
- `GET /health/ready`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /notification-templates`
- `POST /notification-templates`
- `GET /notifications`
- `POST /notifications`
- `GET /notifications/:id/deliveries`
- `GET /notification-preferences`
- `POST /notification-preferences`
- `GET /device-tokens`
- `POST /device-tokens`
- `GET /users`
- `POST /users`
- `GET /docs` (Swagger UI)

## Reliability Defaults
- Env validation runs at startup
- User writes enqueue outbox events inside the DB transaction
- MQ consumers are idempotent via `processed_messages`
- Readiness checks validate DB and RabbitMQ connectivity
- Auth is secure-by-default with an explicit `@Public()` escape hatch
- Refresh tokens are rotated and stored as hashes only
- Notification delivery retries are rescheduled through the outbox and tracked in the database

## Core Docs
- `docs/auth-flow.md`
- `docs/notification-architecture.md`
- `docs/backend-agent-playbook.md`
