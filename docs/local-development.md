# Local development

Needs Docker Desktop, [Supabase CLI](https://supabase.com/docs/guides/local-development), Node 22+, and pnpm (`packageManager` in `package.json`).

## Port clash

Sibling project **az-ra-esm** may already occupy **54321–54323** (Supabase API / db / Studio defaults). If `supabase start` fails on bind, stop that stack or change ports in `supabase/config.toml` for one of the projects.

## Start

```bash
pnpm install
supabase start
supabase status   # copy API URL, anon key, service_role key
```

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=          # from supabase status
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server-only; grant-owner script
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

In Supabase Studio (local): Authentication → Providers → GitHub. Use a GitHub OAuth app with callback `http://127.0.0.1:54321/auth/v1/callback` (local Kong). Site URL `http://localhost:3000`. Additional redirect `http://localhost:3000/auth/callback`.

```bash
pnpm dev          # Next on http://localhost:3000
```

## Owner bootstrap

1. Sign in at `/login` with GitHub (creates a `reader` profile).
2. Grant owner:

```bash
node --env-file=.env.local scripts/grant-owner.mjs <github_username_or_uuid>
```

3. Sign out/in if studio still redirects to `/denied`.

## Types and reset

```bash
./scripts/gen-types.sh          # supabase gen types typescript --local
supabase db reset               # remigrates + seed.sql
```

## Tests

- `pnpm test:unit` — no database.
- Integration: copy local keys into `.env.test` as `TEST_SUPABASE_*` (see `.env.example`). Then `pnpm test:integration`.
- `pnpm test:e2e` — Playwright, local app only.

Never point `.env.test` at production.
