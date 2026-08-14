-- Public media HTTP (bucket flag) without anon Storage listing.
-- Service-role exemption for first-owner bootstrap; lock profile username.
-- Comments only on published posts; rate-limit created_at is not forgeable.

-- -----------------------------------------------------------------------------
-- Storage: public HTTP GET; listing/select via Storage API is owner-only.
-- -----------------------------------------------------------------------------
update storage.buckets
set public = true
where id = 'media';

drop policy if exists media_objects_select on storage.objects;

create policy media_objects_select on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'media'
    and (select public.is_owner())
  );

-- -----------------------------------------------------------------------------
-- Profiles: service_role may grant the first owner; readers cannot change
-- role or github_username. Policies cannot see OLD — username lock is here.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;

  if new.role is distinct from old.role
     and not (
       public.is_owner()
       or auth.jwt() ->> 'role' = 'service_role'
     )
  then
    raise exception 'only owners can change profile role';
  end if;

  if new.github_username is distinct from old.github_username
     and not (
       public.is_owner()
       or auth.jwt() ->> 'role' = 'service_role'
     )
  then
    raise exception 'only owners can change github_username';
  end if;

  return new;
end;
$$;

drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = 'reader'
  );

create unique index profiles_github_username_unique
  on public.profiles (github_username)
  where github_username is not null;

-- -----------------------------------------------------------------------------
-- Comments: insert/select require a published parent; created_at is not null
-- and is forced to now() before the hourly rate-limit count.
-- -----------------------------------------------------------------------------
drop policy if exists comments_insert on public.comments;

create policy comments_insert on public.comments
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1
      from public.posts
      where posts.id = comments.post_id
        and posts.status = 'published'
    )
  );

drop policy if exists comments_select on public.comments;

create policy comments_select on public.comments
  for select
  to anon, authenticated
  using (
    (
      status = 'visible'
      and exists (
        select 1
        from public.posts
        where posts.id = comments.post_id
          and posts.status = 'published'
      )
    )
    or (select public.is_owner())
    or author_id = (select auth.uid())
  );

update public.comments
set created_at = now()
where created_at is null;

alter table public.comments
  alter column created_at set default now();

alter table public.comments
  alter column created_at set not null;

create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.created_at := now();

  if (
    select count(*)
    from public.comments
    where author_id = new.author_id
      and created_at >= now() - interval '1 hour'
  ) >= 5 then
    raise exception 'comment rate limit';
  end if;

  return new;
end;
$$;

create index comments_author_id_idx on public.comments (author_id);
create index comments_parent_id_idx on public.comments (parent_id);

-- -----------------------------------------------------------------------------
-- Trigger functions must not be callable as RPC by anon/authenticated.
-- is_owner(), search_posts, and current_profile_id keep EXECUTE for RLS/RPC.
-- -----------------------------------------------------------------------------
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;
revoke all on function public.enforce_comment_rate_limit() from public, anon, authenticated;
