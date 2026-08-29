---
name: deploy
description: Git-push deploy-on-commit checklist for Vercel fra1 and Supabase eu-central-1. Never configure a Supabase GitHub integration from this repo. Never db push as the day-to-day path.
---

# Deploy

Read `docs/deployment.md` first. Preparing a checklist does **not** authorize a production mutation.

## Model

- App: **git push → Vercel** (`fra1`) after the GitHub repo is connected.
- Schema: add files under `supabase/migrations/` and push. You connect the repo in the Supabase dashboard. Do not set up a Supabase GitHub integration, an Action that **applies migrations**, or `db push` as the day-to-day path. Existing CI and `sync-github-prs.yml` are allowed.
- Database region: **eu-central-1**.

## 1. Identify the target

Preview vs production, Vercel project, Supabase project ref. The `beforeShellExecution` hook asks on `supabase db push|link|…` and `vercel --prod|promote|rollback|env add|rm`.

## 2. Inspect the release

Full diff, pending migrations, env additions/removals. Secrets stay server-only. No `.env.test` production URLs. Auth redirect URLs include the production origin + `/auth/callback`.

## 3. Verify locally

`pnpm typecheck` and `pnpm build`. Migrations: `supabase db reset` + integration tests when `.env.test` exists. Record skipped checks.

## 4. Execute only when authorized

Prefer git push to `main`. **Never `supabase db push` as the day-to-day path.** Never print secret values.

## 5. Post-deploy

Confirm the Vercel build. After first production GitHub login, grant owner:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

Smoke public `/` and `/articles` without mutating data. Report URL, migration state, checks, rollback (revert commit / Vercel rollback).
