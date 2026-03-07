# Deploy Runbook

## Pre-Deploy
- Verify CI green
- Confirm migration safety
- Confirm rollback plan

## Deploy
- Deploy to canary/staging
- Run smoke check
- Promote to production

## Rollback
- Roll back app first
- Roll back migration only if safe and planned
- Verify health endpoint and key flows
