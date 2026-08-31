-- Counter updates must not look like content edits. Like rows are not a public catalog.

-- -----------------------------------------------------------------------------
-- posts.set_updated_at — skip view_count / like_count (and generated search_vector)
-- -----------------------------------------------------------------------------
drop trigger set_updated_at on public.posts;

create trigger set_updated_at
  before update of
    id,
    slug,
    title,
    summary,
    body_md,
    body_html,
    toc_json,
    cover_path,
    status,
    published_at,
    reading_minutes,
    word_count,
    canonical_url,
    series_id,
    series_order,
    created_at,
    updated_at
  on public.posts
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- post_likes select — own row or owner; revoke anon catalog read
-- -----------------------------------------------------------------------------
drop policy post_likes_select on public.post_likes;

create policy post_likes_select on public.post_likes
  for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_owner())
  );

revoke select on public.post_likes from anon;
