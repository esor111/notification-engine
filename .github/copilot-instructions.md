# Copilot / Agent Repository Instructions

## Engineering Expectations
- Keep changes small, deterministic, and test-backed.
- Update API contract in `openapi/openapi.yaml` for externally visible changes.
- Use service-layer business logic and thin controllers.
- Use validation DTOs for all external input.

## Verification
- Always run `npm run verify` before completion.
- If behavior changes, add or update tests.

## Architecture
- Shared infra: `src/common/*`
- Domain code: `src/modules/<domain>/*`
- Docs and runbooks: `docs/*`
- Automation scripts: `scripts/*`
