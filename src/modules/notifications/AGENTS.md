# Notifications Guide

## Scope
This module owns the notification lifecycle from API request to queue dispatch and delivery tracking.

## V1 Shape
- One notification uses one template.
- One template has one channel.
- Delivery rows and logs track retries and outcomes.
- Multi-channel fan-out can be added later by expanding notification creation or worker fan-out.

## Change Map
- Create or query notifications: `service/notifications.service.ts`
- Dispatch logic and retry rules: `service/notification-dispatch.service.ts`
- Queue consumer: `consumer/notification-dispatch.consumer.ts`
- Template management: `../notification-templates/*`
- Preferences: `../notification-preferences/*`
- Device tokens: `../device-tokens/*`
- Provider-specific logic: `../providers/*`
- Mock notification dataset: `mock/mock-notification-data.ts`

## Rules
- Keep notification state changes explicit and logged.
- Delivery retries should be scheduled through the outbox, not RabbitMQ nack loops.
- Provider code should not know about HTTP or database concerns.
- If local development needs stable sample data, update `mock/mock-notification-data.ts` and re-run `npm run seed:notification-mocks`.
- If a real notification microservice is introduced later, integrate it behind `../providers/*` and the existing dispatch flow instead of rewriting notification lifecycle storage.
