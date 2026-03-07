# Change Risk Policy

## Objective
Keep development autonomous by default and enforce human review only when risk is high.

## High-Risk Changes (Human Approval Required)
- Database migrations with data rewrite, drop, or irreversible transformations
- Authentication/authorization logic changes
- Production deployment workflow changes
- Message contract breaking changes

## Low-Risk Changes (Auto Path)
- Pure refactors with no behavior change
- Non-breaking API additive changes with tests
- Test and documentation updates

## Merge Gate
- CI must pass for all changes.
- High-risk paths require owner approval.
