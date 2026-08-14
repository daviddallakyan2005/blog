# Security

Default-deny RLS, cookie-session writes, no open redirects, sanitize all markdown.

## Auth

- GitHub OAuth only. Email (and any other password providers) disabled.
- Callback exchanges a code; `next` must be a same-origin relative path (`/` but not `//`).
- New users get `profiles.role = 'reader'`. Owner is granted only by `scripts/grant-owner.mjs` (service role on a trusted machine). The script takes a UUID or unique `github_username`; non-UUID lookup **exits 1 unless exactly one row**. Prefer UUID.
- `protect_profile_role` must exempt `auth.jwt() ->> 'role' = 'service_role'` so the script can create the first owner.
- `requireOwner()` on studio layout and every mutating action. Middleware refreshes the session; it is not authorization.

## Database

- RLS on every public table. Anon cannot read drafts, revisions, or non-visible comments.
- `SECURITY DEFINER` execute: keep `is_owner`, `search_posts`, `current_profile_id` as needed for RLS/RPC. Trigger functions (`handle_new_user`, `protect_profile_role`, `enforce_comment_rate_limit`) are revoked from `public` / `anon` / `authenticated`.
- Explicit GRANTs. No client insert on `profiles`.
- Service role is not imported by App Router code.

## Storage

- `media` is **public for HTTP object GET**.
- Anon must **not** list or select via the Storage API (draft prefixes must not leak).
- Owner retains select and write.

## XSS / redirects

- `renderMarkdown` always runs `rehype-sanitize`. Preview === publish.
- JSON-LD escapes `<`. RSS escapes XML.
- `robots` disallows `/studio`, `/login`, `/denied`, `/auth`.

## Secrets

`.env`, `.env.*` are gitignored (`.env.example` is not). Never log `SUPABASE_SERVICE_ROLE_KEY`. Do not put the service role key in Vercel. Shell hook asks before `supabase db push|link|…` and production Vercel mutations.

## Comments

Authenticated insert only as `pending` on **published** posts. Owner moderates. Trigger enforces 5 comments / author / hour and forces `created_at` to `now()`.
