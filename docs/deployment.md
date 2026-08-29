# Deployment

Git-connected, deploy-on-commit:

- **Vercel** rebuilds the Next.js app (Git connection, region `fra1`)
- **Supabase** applies new files under `supabase/migrations/` on push to `main` after you connect this repo in the Supabase dashboard (your step, not something in this repo). No Action that applies migrations, no Supabase GitHub integration, no `db push`.

After the one-time setup below, every `git push` to `main` deploys the app. Do not run `supabase db push` or `vercel --prod` as the day-to-day path.

The initial schema for project `snudwrbgqnutqotjmqai` (Blog org, `eu-central-1`) was applied once via CLI. From then on, **only add new migration files** and push.

## 1. Push the repo

```bash
git push -u origin main
```

`.env`, `.env.local`, and other `.env.*` files are git-ignored.

## 2. GitHub OAuth (studio login)

This is Auth, not the repo connection.

1. GitHub → Settings → Developer settings → **OAuth Apps** → New.
2. Homepage URL = `https://daviddallakyan.com`.
3. Authorization callback URL = `https://snudwrbgqnutqotjmqai.supabase.co/auth/v1/callback` (this stays the Supabase Auth URL, not the site origin).
4. In Supabase → Authentication → Providers → **GitHub**: paste Client ID and secret. Enable the provider.
5. **Disable Email** (and any other password providers). GitHub OAuth only.
6. Site URL = `https://daviddallakyan.com`. Redirect allow-list: `https://daviddallakyan.com/auth/callback`, `https://www.daviddallakyan.com/auth/callback`, `https://blog-theta-puce-50.vercel.app/auth/callback`, and `http://127.0.0.1:3000/auth/callback`.

## 3. Protect `main`

GitHub → Settings → Branches → protect `main` and require **CI** (this repo’s `CI` workflow).

## 4. Connect the repo to Vercel (app on push)

1. Import the GitHub repo in the Vercel dashboard (or `vercel link` + git connect).
2. Framework: Next.js. Region: **`fra1`** (`vercel.json` already pins this).
3. Environment variables (Production and Preview):

   | Name                            | Notes                                            |
   | ------------------------------- | ------------------------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | `https://snudwrbgqnutqotjmqai.supabase.co`       |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable                                      |
   | `NEXT_PUBLIC_SITE_URL`          | Production: `https://daviddallakyan.com`. Preview: leave on `*.vercel.app`. |
   | `GITHUB_PR_TOKEN`               | Server-only PAT for Studio **Sync now**. See §6. |
   | `GITHUB_PR_AUTHOR`              | Optional; defaults to `daviddallakyan2005`       |

   Do **not** put `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Owner grant and hourly PR sync stay on a trusted machine / GitHub Action.

4. Deploy-on-commit is the default. Prefer git push over the CLI.

## 5. Grant owner after first login

Sign in once on production so `handle_new_user` inserts the profile, then from a trusted machine:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

`grant-owner.mjs` accepts a UUID **or** a unique `github_username`. Prefer UUID. If the identifier is not a UUID, the script looks up by username and **exits 1 unless exactly one row**.

The `protect_profile_role` trigger must allow `auth.jwt() ->> 'role' = 'service_role'` so the script can create the first owner. That exemption lives in a migration; without it, the grant fails.

Point that env file at the **production** URL and service role only while running the script. Do not commit it. Do not put the service role key in Vercel.

## 6. Hourly GitHub PR sync (Actions)

This is **not** a Supabase GitHub integration and does not apply SQL. `.github/workflows/sync-github-prs.yml` runs hourly (`0 * * * *`) and on `workflow_dispatch`. It checks out the repo, installs with pnpm, and runs `node scripts/sync-github-prs.mjs` (GitHub GraphQL + Postgres upsert only).

Secrets on the **GitHub repo** (Settings → Secrets and variables → Actions):

| Name                        | Notes                                                       |
| --------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Production Supabase URL                                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only; GitHub Actions / trusted machine, never Vercel |
| `GH_PR_TOKEN`               | PAT for public PR read (Actions forbids `GITHUB_*` names; workflow maps this to `GITHUB_PR_TOKEN`) |
| `GH_PR_AUTHOR`              | Optional; defaults to `daviddallakyan2005`                  |

Vercel env (Production and Preview): `GITHUB_PR_TOKEN`, optional `GITHUB_PR_AUTHOR`. Still no service role on Vercel.

PAT setup: fine-grained, resource owner = user, repository access = **Public repositories**, Pull requests Read.

Cron freshness: the public page may stay cached up to one `cacheLife` after the hourly write. Studio **Sync now** busts `github-prs` immediately.

## Custom domain

Canonical origin is **`https://daviddallakyan.com`** (no trailing slash). `www.daviddallakyan.com` 308s to the apex. `blog-theta-puce-50.vercel.app` 308s to the apex (path-preserving).

- Vercel production domain: apex. Region stays `fra1`.
- Production `NEXT_PUBLIC_SITE_URL` = `https://daviddallakyan.com`. Preview stays on `*.vercel.app`. `NEXT_PUBLIC_*` is inlined at build time — change the env var, then redeploy production.
- GitHub OAuth **Homepage URL** = `https://daviddallakyan.com`.
- GitHub OAuth **Authorization callback URL** stays `https://snudwrbgqnutqotjmqai.supabase.co/auth/v1/callback`.
- Supabase Auth **Site URL** = `https://daviddallakyan.com`. Redirect allow-list includes `/auth/callback` on the apex, `www`, the old `*.vercel.app` host, and `http://127.0.0.1:3000`.

## Rollback

Revert the git commit (Vercel redeploys). Schema rollback is a new migration — never rewrite an applied file.
