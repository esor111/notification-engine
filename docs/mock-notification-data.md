# Mock Notification Data

## Purpose
Notification delivery is currently in `mock mode` for local development. Providers are console-backed, and this seed data exists to unblock UI work, manual QA, and agent-driven development without wiring SES, FCM, or Twilio yet.

## Source Of Truth
- Seed command: `npm run seed:notification-mocks`
- Dataset: `src/modules/notifications/mock/mock-notification-data.ts`
- Current mock providers:
  - `src/modules/providers/email/email-notification.provider.ts`
  - `src/modules/providers/push/push-notification.provider.ts`

## Demo User
- Email: `demo.notifications@example.com`
- Full name: `Demo Notifications User`

## Seeded Templates
- `user-welcome-email`
  - Channel: `email`
  - Event type used by internal producers: `account_updates`
- `order-shipped-email`
  - Channel: `email`
  - Event type used by mocks: `order_updates`
- `security-login-push`
  - Channel: `push`
  - Event type used by mocks: `security_alerts`
- `weekly-digest-email`
  - Channel: `email`
  - Event type used by mocks: `marketing_digest`

## Seeded Preferences
- `order_updates` + `email`: enabled
- `security_alerts` + `push`: enabled
- `marketing_digest` + `email`: disabled

## Seeded Device Tokens
- `mock-ios-demo-token` (`ios`)
- `mock-web-demo-token` (`web`)

## Seeded Notifications
- `mock:order:A1001:shipped`
  - Status: `sent`
  - Shows a successful email delivery
- `mock:security:login:1`
  - Status: `sent`
  - Shows a successful push delivery
- `mock:marketing:digest:2026w10`
  - Status: `skipped`
  - Shows preference filtering
- `mock:security:push:dead-letter`
  - Status: `dead_lettered`
  - Shows retry/dead-letter history

## Notes
- Re-running the seed command replaces only notifications with dedupe keys starting with `mock:`.
- The script keeps templates, preferences, and device tokens up to date for the demo user.
- These records are for development only and should not be treated as production fixtures.
