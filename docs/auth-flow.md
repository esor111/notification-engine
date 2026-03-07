# Auth Flow

## Endpoints
- `POST /auth/register`: create user, create local credential, create refresh session, issue tokens
- `POST /auth/login`: verify password, create refresh session, issue tokens
- `POST /auth/refresh`: verify refresh token, revoke old session, issue rotated tokens
- `POST /auth/logout`: revoke refresh session
- `GET /auth/me`: return authenticated user

## Data Model
- `users`: identity/profile data
- `local_credentials`: password hash for local auth
- `refresh_sessions`: hashed refresh token sessions for revocation and rotation

## Security Defaults
- Access tokens are bearer JWTs.
- Refresh tokens are persisted only as hashes.
- Auth is secure-by-default via a global guard; only `@Public()` endpoints bypass it.
- Password hashing uses Argon2id.
- Authorization uses explicit user roles: `user` and `admin`.
- Admin-only endpoints are enforced with `@Roles('admin')` plus a global roles guard.

## Authorization Rules
- New registrations default to role `user`.
- Admin-only HTTP surfaces are currently:
  - `GET /users`
  - `POST /users`
  - `GET /notification-templates`
  - `POST /notification-templates`
- To promote an existing user to admin locally:
  - `npm run auth:promote-admin -- user@example.com`

## Where Agents Change Things
- Claim shape or expiry: `src/modules/auth/service/token.service.ts`
- Password rules: `src/modules/auth/dto/*` and `src/modules/auth/service/password.service.ts`
- Route behavior: `src/modules/auth/controller/auth.controller.ts`
- DB auth schema: `src/common/db/migrations/*` and `src/modules/auth/entity/*`
- Role enforcement: `src/common/auth/roles.decorator.ts`, `src/common/auth/roles.guard.ts`
