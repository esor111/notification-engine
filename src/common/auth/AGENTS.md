# Common Auth Guide

## Purpose
Shared auth primitives belong here only if they are cross-cutting.

## Contents
- `public.decorator.ts`: endpoint opt-out from the global auth guard
- `jwt-auth.guard.ts`: bearer token verification and request user attachment
- `current-user.decorator.ts`: typed access to the authenticated user

## Change Rules
- Keep the guard simple and explicit.
- Avoid hidden auth magic or implicit request mutation outside this folder.
