---
name: migrate
description: Creates a timestamped Supabase migration after the latest file, with RLS and grants, then regenerates types. Use when schema, RLS, functions, or grants must change.
---

# Migrate

Invariants: `database` rule. Default to local. Remote `db push` / `link` requires explicit authorization (hook will ask).

## Workflow

1. State the invariant, callers (`src/lib/data/*`, `src/lib/actions/*`), and whether existing rows need a backfill.
2. List `supabase/migrations/`. New file timestamp must sort **after** the latest.
3. Do not edit an applied migration.
4. Minimum SQL: default-deny RLS, policies, explicit `GRANT`/`REVOKE` (include `service_role` table `ALL` — `auto_expose_new_tables` is unset), `SECURITY DEFINER` `search_path` + `(select public.is_owner())` / `(select auth.uid())`, indexes for filters/FKs/RLS predicates.
5. `./scripts/gen-types.sh` — do not hand-edit `src/lib/database.types.ts`.
6. Update actions/data callers and Zod schemas if the contract changed.
7. Verify per the database rule (`db reset`, integration tests when `.env.test` exists).
8. Review: `blog-db-reviewer` on `cursor-grok-4.6-high`.
9. After local verify is green: ask **Should I commit and push to main?** Production schema applies on push to `main`, not `db push`. If they say yes, follow `deploy` (watch Vercel, confirm the new migration on production, smoke the live site, then stop local Next/Supabase). If they say no, still teardown local.
