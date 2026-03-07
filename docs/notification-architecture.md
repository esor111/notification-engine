# Notification Architecture

## V1 Flow
1. API creates a `notifications` row.
2. The same transaction writes a `queued` log and an outbox event.
3. Outbox publishes `notification.created` to RabbitMQ.
4. Dispatch consumer loads notification, template, user, and preferences.
5. Provider sends through the template channel.
6. Delivery row and notification logs are written.
7. Failures schedule retry events through the outbox until max retries are reached.
8. Max retry failures are marked `dead_lettered` in the database.

## Tables
- `notification_templates`
- `notifications`
- `notification_deliveries`
- `user_notification_preferences`
- `device_tokens`
- `notification_logs`

## V1 Tradeoff
This version supports one channel per template to keep the codebase small and explicit. Multi-channel fan-out can be added later without replacing the core tables.

## Current Dev Mode
- Email and push providers are mocked through console-backed providers.
- Local sample data is seeded through `npm run seed:notification-mocks`.
- The mock dataset lives in `src/modules/notifications/mock/mock-notification-data.ts`.

## Future Integration Boundary
- When the dedicated notification microservice or real providers are ready, replace only the provider implementations and queue publishing targets.
- Keep `notifications`, `notification_deliveries`, `notification_logs`, preferences, and device tokens as the source of truth for lifecycle state.
- Do not move delivery state tracking into provider adapters; agents should still find the lifecycle in the notification module first.
