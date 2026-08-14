# Deployment

Git-connected, deploy-on-commit, matching az-ra-esm:

- **Vercel** rebuilds the Next.js app (native Git integration, region `fra1`)
- **Supabase** applies new `supabase/migrations/**` (native GitHub integration — free on all plans, no access token, no GitHub Action `db push`)

After the one-time setup below, every `git push` to `main` deploys both. Do not run `supabase db push` or `vercel --prod` as the day-to-day path.

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
5. Do **not** also run a GitHub Action that `db push`es — that would double-apply.

Recommended: GitHub → Settings → Branches → protect `main` and require the **Supabase** check.

## 3. GitHub OAuth (studio login)

This is separate from the GitHub *integration* above.

1. GitHub → Settings → Developer settings → **OAuth Apps** → New.
2. Homepage URL = `https://blog-theta-puce-50.vercel.app` (or a custom domain).
3. Authorization callback URL = `https://snudwrbgqnutqotjmqai.supabase.co/auth/v1/callback`
4. In Supabase → Authentication → Providers → **GitHub**: paste Client ID and secret. Enable the provider.
5. Site URL = `https://blog-theta-puce-50.vercel.app`. Redirect allow-list: `https://blog-theta-puce-50.vercel.app/auth/callback` and `http://127.0.0.1:3000/auth/callback`.

## 4. Connect the repo to Vercel (app on push)

1. Import the GitHub repo in the Vercel dashboard (or `vercel link` + git connect).
2. Framework: Next.js. Region: **`fra1`** (`vercel.json` already pins this).
3. Environment variables (Production and Preview):

   | Name | Notes |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://snudwrbgqnutqotjmqai.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable |
   | `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Never expose to the browser |
   | `NEXT_PUBLIC_SITE_URL` | `https://blog-theta-puce-50.vercel.app` |

4. Deploy-on-commit is the default. Prefer git push over the CLI.

## 5. Grant owner after first login

Sign in once on production so `handle_new_user` inserts the profile, then from a trusted machine:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

Point that env file at the **production** URL and service role only while running the script. Do not commit it.

## Rollback

Revert the git commit (Vercel redeploys). Schema rollback is a new migration — never rewrite an applied file.
