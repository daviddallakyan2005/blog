# Performance

Keep reads cached and close to the database. Detail: `.cursor/skills/performance-engineering/PERFORMANCE.md`.

## Defaults

- Public loaders: `'use cache'` + `cacheTag` + `cacheLife("hours")` + anon client (`src/lib/data/*`).
- Writes: `updateTag` on `posts` / `post:${slug}` / `tags` / `projects` / `timeline` / `settings` / `comments`.
- `cacheComponents: true` in `next.config.ts`.
- Parallelize independent fetches (`Promise.all`). No cookie client inside cached functions.

## Locality

Vercel **fra1**, Supabase **eu-central-1**. Do not add a distant third-party to the article path.

## Postgres

Select list vs detail columns. Cap lists. Full-text via `search_posts` (published only). RLS helpers use scalar subqueries so they initplan.

## Client

Public pages stay RSC + sanitized HTML. Studio editor stays off the public bundle.
