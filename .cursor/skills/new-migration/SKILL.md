---
name: new-migration
description: Creates a timestamped Supabase migration after the latest file, with RLS and explicit GRANTs, then regenerates types via scripts/gen-types.sh. Use when schema, RLS, functions, or grants must change.
---

# Create a Supabase migration

Default to local. Remote `db push` / `link` requires explicit user authorization (the shell hook will ask).

## Workflow

1. State the invariant, callers (`src/lib/data/*`, `src/lib/actions/*`), and whether existing rows need a backfill.
2. List `supabase/migrations/` and take the latest `YYYYMMDDHHMMSS_*` prefix. New file must sort **after** that timestamp.
3. Do not edit an applied migration.
4. Implement the minimum SQL:
   - `enable row level security` on new tables (default-deny);
   - policies for anon/authenticated/owner;
   - explicit `GRANT` / `REVOKE` (newer Supabase does not auto-expose public tables);
   - `SECURITY DEFINER` functions set `search_path` and use `(select public.is_owner())` or `(select auth.uid())`;
   - indexes for filters, FKs, and RLS predicates.
5. Regenerate types from the repo root:

   ```bash
   ./scripts/gen-types.sh
   ```

   Do not hand-edit `src/lib/database.types.ts`.
6. Update actions/data callers and Zod schemas if the contract changed.
7. `supabase db reset` locally. Run `pnpm test:integration` when `.env.test` exists.
8. Independent review: `blog-db-reviewer` on `cursor-grok-4.6-high`.

## Review questions

- Can anon read a draft, revision, or pending comment?
- Does a definer function or service-role path bypass a policy without replacing authorization?
- Will a fresh reset and an upgrade with existing rows both succeed?
- Are function grants narrower than `PUBLIC`?
