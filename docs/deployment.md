# Deployment

Git-connected, deploy-on-commit, matching az-ra-esm:

- **Vercel** rebuilds the Next.js app (native Git integration, region `fra1`)
- **Supabase** applies new `supabase/migrations/**` (native GitHub integration — free on all plans, no access token, no GitHub Action `db push`)

There is **no** `.github/workflows/deploy-migrations.yml`. After the one-time setup below, every `git push` to `main` deploys both. Do not run `supabase db push` or `vercel --prod` as the day-to-day path. Do **not** run a GitHub Action that `db push`es.

The initial schema for project `snudwrbgqnutqotjmqai` (Blog org, `eu-central-1`) was applied once via CLI so the first GitHub-integration deploy sees an already-migrated database. From then on, **only add new migration files** and push.

## 1. Push the repo

```bash
git push -u origin main
```

`.env`, `.env.local`, and other `.env.*` files are git-ignored.

## 2. Connect the repo to Supabase (migrations on push)

Dashboard: [Integrations](https://supabase.com/dashboard/project/snudwrbgqnutqotjmqai/settings/integrations) → **GitHub → Connect**.

1. Authorize Supabase on GitHub and select this repository.
2. **Supabase directory:** `supabase`
3. **Production branch:** `main`
4. Enable **Deploy to production** (apply migrations on push/merge to `main`)
5. Do **not** also run a GitHub Action that `db push`es — that would double-apply. This repo has no migration workflow.

**One-time cleanup:** after removing `.github/workflows/deploy-migrations.yml`, delete unused GitHub Actions secrets `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`.

## 3. GitHub OAuth (studio login)

This is separate from the GitHub *integration* above.

1. GitHub → Settings → Developer settings → **OAuth Apps** → New.
2. Homepage URL = `https://blog-theta-puce-50.vercel.app` (or a custom domain).
3. Authorization callback URL = `https://snudwrbgqnutqotjmqai.supabase.co/auth/v1/callback`
4. In Supabase → Authentication → Providers → **GitHub**: paste Client ID and secret. Enable the provider.
5. **Disable Email** (and any other password providers). GitHub OAuth only.
6. Site URL = `https://blog-theta-puce-50.vercel.app`. Redirect allow-list: production `/auth/callback` (`https://blog-theta-puce-50.vercel.app/auth/callback`) and `http://127.0.0.1:3000/auth/callback`.

## 4. Protect `main`

GitHub → Settings → Branches → protect `main` and require **CI** (this repo’s `CI` workflow). Optionally also require the **Supabase** check from the GitHub integration.

## 5. Connect the repo to Vercel (app on push)

1. Import the GitHub repo in the Vercel dashboard (or `vercel link` + git connect).
2. Framework: Next.js. Region: **`fra1`** (`vercel.json` already pins this).
3. Environment variables (Production and Preview):

   | Name | Notes |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://snudwrbgqnutqotjmqai.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable |
   | `NEXT_PUBLIC_SITE_URL` | `https://blog-theta-puce-50.vercel.app` |

   Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Owner grant stays on a trusted machine via `.env.local`.

4. Deploy-on-commit is the default. Prefer git push over the CLI.

## 6. Grant owner after first login

Sign in once on production so `handle_new_user` inserts the profile, then from a trusted machine:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

`grant-owner.mjs` accepts a UUID **or** a unique `github_username`. Prefer UUID. If the identifier is not a UUID, the script looks up by username and **exits 1 unless exactly one row**.

The `protect_profile_role` trigger must allow `auth.jwt() ->> 'role' = 'service_role'` so the script can create the first owner. That exemption lives in a migration; without it, the grant fails.

Point that env file at the **production** URL and service role only while running the script. Do not commit it. Do not put the service role key in Vercel.

## Rollback

Revert the git commit (Vercel redeploys). Schema rollback is a new migration — never rewrite an applied file.
