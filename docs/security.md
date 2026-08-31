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
- `SECURITY DEFINER` execute: keep `is_owner`, `search_posts`, `current_profile_id`, `increment_post_view` as needed for RLS/RPC. Trigger functions (`handle_new_user`, `protect_profile_role`, `enforce_comment_rate_limit`, `sync_post_like_count`) are revoked from `public` / `anon` / `authenticated`.
- Explicit GRANTs. No client insert on `profiles`.
- Service role is not imported by App Router code. It is allowed in `scripts/grant-owner.mjs` and `scripts/sync-github-prs.mjs` (GitHub Action / trusted machine) only — never in the App Router or Vercel.

## Storage

- `media` is **public for HTTP object GET**.
- Anon must **not** list or select via the Storage API (draft prefixes must not leak).
- Owner retains select and write.

## XSS / redirects

- `renderMarkdown` always runs `rehype-sanitize`. Preview === publish.
- JSON-LD escapes `<`. RSS escapes XML.
- `robots` disallows `/studio`, `/login`, `/denied`, `/auth`.
- `next` must remain same-origin after URL normalization; reject pathnames that start with `//`.

## Secrets

`.env`, `.env.*` are gitignored (`.env.example` is not). Never log `SUPABASE_SERVICE_ROLE_KEY` or `GITHUB_PR_TOKEN`. Do not put the service role key in Vercel. Shell hook asks before `supabase db push|link|…` and production Vercel mutations.

`GITHUB_PR_TOKEN` is a PAT for reading public pull requests (one GraphQL search), not OAuth login scopes (`read:user user:email` stay on the OAuth App). Fine-grained PAT: resource owner = user, repository access = **Public repositories** (not this blog repo only), Pull requests Read. Classic PAT with no extra scopes, or `public_repo` if search only returns owned repos. `scripts/sync-github-prs.mjs` does not call `updateTag`; the public page may stay cached for up to one `cacheLife` after the hourly write. Studio Sync now busts `github-prs`.

## Comments

Authenticated insert only as `pending` on **published** posts. Owner moderates. Trigger enforces 5 comments / author / hour and forces `created_at` to `now()`.

## Likes / views

Authenticated insert/delete on `post_likes` with `profile_id = auth.uid()`. Insert requires a published parent. Select is own row or owner — anon has no SELECT grant (liker graph is not public). No UPDATE policy or grant. Trigger `sync_post_like_count` maintains `posts.like_count` and is revoked from `public` / `anon` / `authenticated`. Anon and authenticated may `EXECUTE increment_post_view` (published rows only). Direct `UPDATE posts` (including `view_count` / `like_count`) stays owner-only. Counter-only updates do not bump `posts.updated_at`.

