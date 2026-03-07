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
