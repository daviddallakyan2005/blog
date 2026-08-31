# Content model

Source of truth: `supabase/migrations/`. Types: `src/lib/database.types.ts` (generated).

## Tables

| Table | Role |
| --- | --- |
| `profiles` | `auth.users` 1:1. `role` is `owner` \| `reader` (default). Trigger inserts on signup; clients cannot INSERT. |
| `posts` | Articles. `status` (`draft` \| `published` \| `archived`), `body_md` / `body_html`, toc, cover, reading stats, `search_vector`, `view_count` / `like_count` (non-negative; default 0). |
| `tags` / `post_tags` | Taxonomy. |
| `post_revisions` | Owner-only history. |
| `media_assets` | Metadata for Storage `media` bucket. |
| `site_settings` | Singleton `id = 1` (display name, bio, `cv_md` / `cv_html`, social, SEO). |
| `projects` | Public catalog. |
| `timeline_entries` | About page (`role`, `education`, `talk`, `award`, `oss_contribution`). |
| `github_pull_requests` | Public GitHub PR snapshots; owner writes. |
| `comments` | `visible` \| `pending` \| `hidden` \| `spam`. Rate limit: 5/hour/author. |
| `post_likes` | One like per (`post_id`, `profile_id`). Trigger `sync_post_like_count` keeps `posts.like_count`. |

`search_posts(q, limit_n)` is SECURITY DEFINER and returns **published** rows only.

`increment_post_view(post_id)` is SECURITY DEFINER and increments `view_count` only when `status = 'published'`. Direct `UPDATE posts` stays owner-only.

## RLS summary

RLS is enabled and default-deny. Policies use `(select public.is_owner())` / `(select auth.uid())`.

| Object | Anon / reader | Owner |
| --- | --- | --- |
| `posts` | `status = 'published'` | all |
| `post_tags` | if parent post published | all |
| `post_revisions` | none | all |
| `tags`, `projects`, `timeline_entries`, `github_pull_requests`, `site_settings`, `media_assets`, `profiles` | select | write |
| `comments` | `visible`, or own rows | all + moderate |
| `comments` insert | authenticated, `author_id = auth.uid()`, `status = 'pending'` | same |
| `post_likes` | own row only (no anon select) | all |
| `post_likes` insert | authenticated, `profile_id = auth.uid()`, parent `published` | same |
| `post_likes` delete | own row | own row or owner |
| `post_likes` update | none | none |
| `storage.objects` (`media`) | select | write |

GRANTs: anon/authenticated `SELECT` on public catalogs; authenticated `INSERT/UPDATE/DELETE` where policies allow. `post_revisions` select is authenticated-only. No profile insert grant. `service_role` gets `ALL` on public tables (`auto_expose_new_tables` is unset).

Owner role is **not** assigned by `handle_new_user`. Use `scripts/grant-owner.mjs`.
