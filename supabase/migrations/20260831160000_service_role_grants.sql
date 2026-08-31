-- service_role bypasses RLS but still needs table GRANTs for the Data API.
-- auto_expose_new_tables is unset (cloud default; flag removed 2026-10-30).
-- Trigger functions stay ungranted as RPC (handle_new_user, protect_profile_role,
-- enforce_comment_rate_limit, sync_post_like_count).

grant usage on schema public to service_role;

grant all on
  public.posts,
  public.tags,
  public.post_tags,
  public.profiles,
  public.media_assets,
  public.site_settings,
  public.post_revisions,
  public.projects,
  public.timeline_entries,
  public.comments,
  public.github_pull_requests,
  public.post_likes
to service_role;

-- Future CREATE TABLE in migrations (owner postgres) inherits this grant.
alter default privileges for role postgres in schema public
  grant all on tables to service_role;
