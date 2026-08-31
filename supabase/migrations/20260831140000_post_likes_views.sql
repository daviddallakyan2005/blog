-- Public view/like counters on posts; one like per authenticated reader per post.
-- Direct UPDATE on posts stays owner-only. Views go through increment_post_view.

-- -----------------------------------------------------------------------------
-- posts.view_count / like_count
-- -----------------------------------------------------------------------------
alter table public.posts
  add column view_count int not null default 0 check (view_count >= 0),
  add column like_count int not null default 0 check (like_count >= 0);

-- -----------------------------------------------------------------------------
-- post_likes — one row per (post, profile)
-- -----------------------------------------------------------------------------
create table public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index post_likes_profile_id_idx on public.post_likes (profile_id);

alter table public.post_likes enable row level security;

create policy post_likes_select on public.post_likes
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_likes.post_id
        and posts.status = 'published'
    )
    or (select public.is_owner())
    or profile_id = (select auth.uid())
  );

create policy post_likes_insert on public.post_likes
  for insert
  to authenticated
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1
      from public.posts
      where posts.id = post_likes.post_id
        and posts.status = 'published'
    )
  );

create policy post_likes_delete on public.post_likes
  for delete
  to authenticated
  using (
    profile_id = (select auth.uid())
    or (select public.is_owner())
  );

grant select on public.post_likes to anon, authenticated;
grant insert, delete on public.post_likes to authenticated;

-- -----------------------------------------------------------------------------
-- Keep posts.like_count in sync (trigger-only; not callable as RPC)
-- -----------------------------------------------------------------------------
create function public.sync_post_like_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set like_count = like_count + 1
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set like_count = greatest(like_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;

  return null;
end;
$$;

revoke all on function public.sync_post_like_count() from public, anon, authenticated;

create trigger post_likes_sync_like_count
  after insert or delete on public.post_likes
  for each row
  execute function public.sync_post_like_count();

-- -----------------------------------------------------------------------------
-- increment_post_view — published posts only (SECURITY DEFINER)
-- -----------------------------------------------------------------------------
create function public.increment_post_view(post_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.posts
  set view_count = view_count + 1
  where id = increment_post_view.post_id
    and status = 'published';
$$;

revoke all on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;
