---
name: deploy-checklist
description: Git-push deploy-on-commit checklist for Vercel fra1 and Supabase eu-central-1. Never configure a Supabase GitHub integration from this repo. Never db push as the day-to-day path.
---

# Deployment checklist

Read `docs/deployment.md` first. Preparing a checklist does **not** authorize a production mutation.

## Model

- App: **git push → Vercel** (region `fra1`) after the GitHub repo is connected.
- Schema: add files under `supabase/migrations/` and push. Supabase applies them only after **you** connect the repo in the dashboard. Do not set up a Supabase GitHub integration, an Action that **applies migrations**, or `db push` as the day-to-day path. Existing CI and `sync-github-prs.yml` (GitHub API + Postgres upsert only) are allowed.
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
- **Never `supabase db push` as the day-to-day path.** Do not apply migrations from an Action or configure a Supabase GitHub integration here. CI and `sync-github-prs.yml` are allowed.
- Never print secret values.

## 5. Post-deploy

- Confirm the Vercel build. Do not connect or verify a Supabase GitHub integration from the agent.
- After first production GitHub login, grant owner:

  ```bash
  node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
  ```

- Smoke public `/` and `/articles` without mutating data. Report URL, migration state, checks, rollback (revert commit / Vercel rollback).
