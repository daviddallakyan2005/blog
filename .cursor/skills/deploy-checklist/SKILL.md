---
name: deploy-checklist
description: Git-push deploy-on-commit checklist for Vercel fra1 and Supabase eu-central-1. Native GitHub integrations for app and migrations. Never db push as the day-to-day path.
---

# Deployment checklist

Read `docs/deployment.md` first. Preparing a checklist does **not** authorize a production mutation.

## Model

- App: **git push → Vercel native Git integration** (region `fra1`).
- Schema: **git push → Supabase native GitHub integration** applies new files in `supabase/migrations/` on `main`. Free on all plans. No migration GitHub Action, no day-to-day `db push`.
- Database region: **eu-central-1**. Keep compute next to data.

## 1. Identify the target

- Confirm preview vs production, Vercel project, and Supabase project ref.
- Confirm whether the user authorized remote changes. The `beforeShellExecution` hook asks on `supabase db push|link|…` and `vercel --prod|promote|rollback|env add|rm`.

## 2. Inspect the release

- Full diff, pending migrations, env additions/removals.
- Secrets stay server-only. No `.env.test` production URLs.
- Auth redirect URLs include the production origin + `/auth/callback`.

## 3. Verify locally

- `pnpm typecheck` and `pnpm build`.
- Migrations: `supabase db reset` + integration tests when `.env.test` exists.
- Record skipped checks.

## 4. Execute only when authorized

- Prefer git push to `main` over manual `vercel --prod` or `supabase db push`.
- **Never `supabase db push` as the day-to-day path.** The GitHub integration applies new migration files.
- Never print secret values.

## 5. Post-deploy

- Confirm Vercel build and the Action (if migrations shipped).
- After first production GitHub login, grant owner:

  ```bash
  node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
  ```

- Smoke public `/` and `/articles` without mutating data. Report URL, migration state, checks, rollback (revert commit / Vercel rollback).
