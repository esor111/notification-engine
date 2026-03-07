# Architecture

## Principles
- Contract-first APIs
- Deterministic automation
- Observability by default
- Safe migrations and idempotent async processing

## Boundaries
- Controllers handle transport concerns only.
- Services hold business use cases.
- Repositories handle persistence.
- Common infrastructure lives in `src/common`.

## Reliability Strategy
- Strict validation and typed DTOs
- Standard error envelope
- Health checks and smoke tests
- Automated CI quality gate

## Deployment Safety
- Risk-based approvals for production
- Fast rollback strategy
- Runbooks for common incidents
