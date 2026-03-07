# Auth Module Guide

## Golden Path
- Registration and login logic lives in `service/auth.service.ts`.
- HTTP transport stays in `controller/auth.controller.ts`.
- Password hashing is isolated in `service/password.service.ts`.
- Access/refresh token issuance is isolated in `service/token.service.ts`.
- Credential persistence is separate from user profile persistence.

## Change Rules
- Do not add auth logic to `users` controllers or services.
- Keep `refresh_sessions` rotation explicit and test-backed.
- If you change JWT claims or DTO shapes, update `openapi/openapi.yaml` and tests.
- New public auth endpoints must use `@Public()` explicitly.
