# Security

Default-deny RLS, cookie-session writes, no open redirects, sanitize all markdown.

## Auth

- GitHub OAuth only. Callback exchanges a code; `next` must be a same-origin relative path (`/` but not `//`).
- New users get `profiles.role = 'reader'`. Owner is granted only by `scripts/grant-owner.mjs` (service role).
- `requireOwner()` on studio layout and every mutating action. Middleware refreshes the session; it is not authorization.

## Database

- RLS on every public table. Anon cannot read drafts, revisions, or non-visible comments.
- `SECURITY DEFINER` functions set `search_path` and grant execute narrowly (`is_owner`, `search_posts`, signup trigger, comment rate limit).
- Explicit GRANTs. No client insert on `profiles`.
- Service role is not imported by App Router code.

## XSS / redirects

- `renderMarkdown` always runs `rehype-sanitize`. Preview === publish.
- JSON-LD escapes `<`. RSS escapes XML.
- `robots` disallows `/studio`, `/login`, `/denied`, `/auth`.

## Secrets

`.env`, `.env.*` are gitignored (`.env.example` is not). Never log `SUPABASE_SERVICE_ROLE_KEY`. Shell hook asks before `supabase db push|link|…` and production Vercel mutations.

## Comments

Authenticated insert as `pending`. Owner moderates. Trigger enforces 5 comments / author / hour.
