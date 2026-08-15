# Architecture

Personal technical blog: public reading site + owner studio. Next.js 16 App Router in `src/`, Supabase (Postgres, GitHub Auth, Storage), Vercel `fra1` next to Supabase `eu-central-1`.

## Runtime split

| Surface | Routes | Data |
| --- | --- | --- |
| Public | `src/app/(site)/` — `/`, articles, notes, tags, projects, contributions, about, search | `'use cache'` loaders in `src/lib/data/*` via cookie-less anon client |
| Studio | `src/app/studio/` | Cookie client + `requireOwner()` |
| Auth | `/login`, `/denied`, `/auth/callback` | GitHub OAuth; `safeNextPath` blocks open redirects |
| Feeds | `sitemap.ts`, `robots.ts`, `feed.xml/route.ts` | Published rows only |

## Clients

- `src/lib/supabase/server.ts` / `browser.ts` — cookie session. CRUD and OAuth.
- `src/lib/supabase/anon.ts` — no cookies. Public cached reads only.
- `src/lib/supabase/admin.ts` — service role. **Not used by the App Router.** Owner grant and PR sync scripts (`scripts/grant-owner.mjs`, `scripts/sync-github-prs.mjs`) build their own service-role clients.

## Writes

Server Actions in `src/lib/actions/` validate with Zod (`src/lib/validations/`), call `requireOwner()`, write through the cookie client (RLS), persist `renderMarkdown` output, then `updateTag`.

## Markdown

One pipeline: `src/lib/markdown/render.ts` (GFM, math, Shiki, sanitize). Preview and publish share it.

## Cache

`next.config.ts` → `cacheComponents: true`. Tags: `posts`, `post:${slug}`, `tags`, `projects`, `project:${slug}`, `timeline`, `settings`, `comments`, `comments:${postId}`, `github-prs`.

## Authz

Signup trigger creates a `reader` profile. Owner is granted out of band. Studio and mutating actions check `profiles.role = 'owner'`. Non-owners hitting studio land on `/denied`.
