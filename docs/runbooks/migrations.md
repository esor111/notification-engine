# Migration Runbook

## Rules
- Never use `synchronize: true` outside isolated tests.
- Use forward-only migrations whenever possible.
- Test migration in staging before production.

## Local Workflow
1. Create migration: `pnpm db:generate`
2. Review generated SQL
3. Run migration: `pnpm db:migrate`
4. Run verification: `pnpm verify`

## Production Safety
- Require human approval for destructive migration PRs.
- Keep rollback strategy documented before deployment.
