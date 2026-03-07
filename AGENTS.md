# Agent-Friendly Backend Starter

This repository is optimized for autonomous coding agents and fast, reliable delivery.

## Golden Path Commands
- `npm run verify`: format, lint, typecheck, unit, integration, e2e, contract, build
- `npm run test:smoke`: run a quick local health check
- `npm run doctor`: validate local developer setup
- `npm run db:migrate`: run DB migrations
- `npm run seed:notification-mocks`: seed stable local notification fixtures
- `npm run auth:promote-admin -- user@example.com`: promote a local user to admin

## Guardrails
- Keep API changes contract-first in `openapi/openapi.yaml`.
- Use migrations only. Never use schema auto-sync in shared environments.
- Keep logs structured and include trace correlation fields.
- Put business logic in services, not controllers.
- Use typed DTOs and validation for all external input.

## Risk-Based Human Review
- Required for changes in `src/common/db/migrations/*`
- Required for changes in `.github/workflows/*`
- Required for auth/permission model changes
- Optional for low-risk refactors/docs/tests

## Where To Change What
- New HTTP endpoint: `src/modules/<domain>/controller`
- Business logic: `src/modules/<domain>/service`
- DB access: `src/modules/<domain>/repository` + migrations
- Cross-cutting infra: `src/common/*`
- Auth flow: `src/modules/auth/*` and `src/common/auth/*`
- Notification flow: `src/modules/notifications/*`, `src/modules/notification-templates/*`, `src/modules/notification-preferences/*`, `src/modules/device-tokens/*`
- API contract: `openapi/openapi.yaml`
- Operational docs: `docs/runbooks/*`

## Auth Rules
- Auth is secure-by-default via a global JWT guard.
- Authorization is role-based with `user` and `admin`.
- Public endpoints must opt out explicitly with `@Public()`.
- Password hashing belongs only in `src/modules/auth/service/password.service.ts`.
- Refresh token rotation belongs only in `src/modules/auth/service/auth.service.ts`.
- Admin-only routes must use `@Roles('admin')`.

## Notification Rules
- New notifications are created through `src/modules/notifications/service/notifications.service.ts`.
- Dispatch and retry logic belongs only in `src/modules/notifications/service/notification-dispatch.service.ts`.
- Delivery retries are rescheduled via the outbox, not via RabbitMQ nack loops.
- Stable local notification fixtures live in `src/modules/notifications/mock/mock-notification-data.ts`.

## Required Before Merge
- `npm run verify` passes
- OpenAPI updated for API behavior changes
- Tests added for new logic
- No secrets committed
- Observability impact considered
