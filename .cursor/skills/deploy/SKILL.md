---
name: deploy
description: After local typecheck/test/build, ask whether to commit and push to main. If yes, git-push deploy, watch Vercel logs, confirm Supabase migrations, smoke the live site, then stop local Next/Supabase. Never configure a Supabase GitHub integration from this repo. Never db push as the day-to-day path.
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

## 4. Ask, then execute only when authorized

After local typecheck/test/build: ask **Should I commit and push to main?** Do nothing until they answer.

If no: do not commit. Teardown local (step 6).

If yes: commit (they asked), then `git push` to `main`. Prefer that over `vercel --prod`. **Never `supabase db push` as the day-to-day path.** Never print secret values.

## 5. Post-push — do not declare done until all three succeed

1. **Vercel logs** — find the deployment for this commit (`list_deployments`), then watch `get_deployment_build_logs` until READY or ERROR. If ERROR, report the failing lines and stop. If the site 5xxs after READY, check `get_runtime_logs`.
2. **Supabase migrations** — if this push added files under `supabase/migrations/`, confirm those filenames are applied on the production project (`list_migrations`). If there were no new migrations, say so. Do not `db push`.
3. **Live site** — GET production `https://daviddallakyan.com/` and `/articles` (plus any route this change affects). Expect 200 and no error page. Do not mutate data.

After first production GitHub login, grant owner:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

Report URL, Vercel deployment status, migration state, checks, rollback (revert commit / Vercel rollback). Then teardown local (step 6).

## 6. Teardown local

When the work is fully finished (they said no, or step 5 succeeded): stop this repo's local Next (`pnpm dev` / `next start` on :3000), `supabase stop`, and any other local servers/watchers this session started (Playwright webServer, `vitest` watch). Do not stop sibling Docker stacks (e.g. az-ra-esm) or Cursor. If Vercel or the live site failed, leave local running so they can debug.
