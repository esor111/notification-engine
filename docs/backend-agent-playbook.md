# Backend Agent Playbook

## Golden Workflow
1. Read `AGENTS.md` and module-local instructions.
2. Update API contract first when behavior changes.
3. Implement code in the smallest scoped module.
4. Add tests close to changed behavior.
5. Run `npm run verify`.

## Change Types
- Endpoint change: update `openapi/openapi.yaml`, controller, service, tests.
- DB change: add migration, update repository logic, integration tests.
- MQ change: define payload schema, idempotency key, retry/DLQ behavior.
- Observability change: update logs/metrics/traces and dashboards.
- Auth change: update `src/modules/auth/*`, `src/common/auth/*`, `docs/auth-flow.md`, and tests.

## Done Criteria
- Deterministic local + CI verification
- Docs updated if behavior or operations changed
- No hidden manual steps
