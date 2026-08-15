# Personal technical blog

Articles, notes, projects, and an about/timeline page. I write in `/studio`; everyone else reads published rows through Postgres RLS.

## Stack

- Next.js 16 App Router (`src/`), React 19, Tailwind CSS v4, shadcn-style `src/components/ui`
- Supabase Postgres + GitHub Auth + Storage (`eu-central-1`)
- Vercel (`fra1`), deploy on git push
- pnpm, Vitest, Playwright

## Local quickstart

Docker + Supabase CLI. If **az-ra-esm** is already running, it may hold **54321–54323**.

```bash
pnpm install
supabase start
# copy URL + keys from `supabase status` into .env.local (see .env.example)
pnpm dev
```

Sign in at `/login`, then grant owner:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

More: [docs/local-development.md](docs/local-development.md).

## Docs

- [Architecture](docs/architecture.md)
- [Content model & RLS](docs/content-model.md)
- [Local development](docs/local-development.md)
- [Deployment](docs/deployment.md)
- [Design](docs/design.md)
- [Performance](docs/performance.md)
- [Security](docs/security.md)

## Deploy

Push `main` and both platforms deploy:

- **Vercel** (`fra1`) rebuilds the app when the GitHub repo is connected
- **Supabase** (Blog org, `eu-central-1`) applies new files under `supabase/migrations/` when you connect this repo in the Supabase dashboard — no `db push`, no Action that applies migrations. Hourly PR sync (`.github/workflows/sync-github-prs.yml`) talks to GitHub and Postgres only.

One-time: import the repo in Vercel, set public env vars (no service role key), add a GitHub OAuth app for studio login (GitHub Auth on, Email off). Protect `main` and require CI. Connect the same repo in Supabase yourself if you want migrations on push.

Details: [docs/deployment.md](docs/deployment.md).

## Owner bootstrap

`handle_new_user` always inserts `reader`. After the first GitHub login (local or production), run `scripts/grant-owner.mjs` with the service role on a trusted machine (UUID or unique `github_username`; prefer UUID). Supported service-role uses are `scripts/grant-owner.mjs` and `scripts/sync-github-prs.mjs` (GitHub Action / trusted machine). Do not put the service role key in Vercel.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Next (Turbopack) |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | Gates |
| `pnpm test:unit` | `src/**/*.test.ts` |
| `pnpm test:integration` | `tests/**` (needs `.env.test`) |
| `pnpm test:e2e` | Playwright |
| `./scripts/gen-types.sh` | Regenerate `src/lib/database.types.ts` |
