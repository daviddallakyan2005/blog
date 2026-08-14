-- Row Level Security, SECURITY DEFINER helpers, auth profile trigger, and GRANTs.
-- Tables already have RLS enabled (default deny) from 20260815000001_init.sql.

-- -----------------------------------------------------------------------------
-- Security-definer helpers used by RLS policies.
-- Scalar subquery wrappers ((select public.is_owner())) let Postgres cache the
-- result once per statement (initplan) instead of per row.
-- -----------------------------------------------------------------------------
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select id
  from public.profiles
  where id = auth.uid();
$$;

revoke all on function public.is_owner() from public;
revoke all on function public.current_profile_id() from public;
grant execute on function public.is_owner() to anon, authenticated;
grant execute on function public.current_profile_id() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Provision a reader profile on signup. Owner is never assigned here.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  meta jsonb;
begin
  meta := coalesce(new.raw_user_meta_data, '{}'::jsonb);

  insert into public.profiles (
    id,
    github_username,
    display_name,
    avatar_url
  )
  values (
    new.id,
    nullif(coalesce(meta->>'user_name', meta->>'preferred_username'), ''),
    nullif(coalesce(meta->>'full_name', meta->>'name', new.email), ''),
    nullif(meta->>'avatar_url', '')
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;

create trigger handle_new_user
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Non-owners cannot change role. Nobody can change profile id.
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

  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'only owners can change profile role';
  end if;

  return new;
end;
$$;

revoke all on function public.protect_profile_role() from public;

create trigger protect_profile_role
  before update on public.profiles
  for each row
  execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select
  to anon, authenticated
  using (true);

create policy profiles_update_self on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_owner on public.profiles
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy profiles_delete on public.profiles
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------
create policy posts_select on public.posts
  for select
  to anon, authenticated
  using (status = 'published' or (select public.is_owner()));

create policy posts_insert on public.posts
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy posts_update on public.posts
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy posts_delete on public.posts
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- tags
-- -----------------------------------------------------------------------------
create policy tags_select on public.tags
  for select
  to anon, authenticated
  using (true);

create policy tags_insert on public.tags
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy tags_update on public.tags
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy tags_delete on public.tags
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- post_tags
-- -----------------------------------------------------------------------------
create policy post_tags_select on public.post_tags
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_tags.post_id
        and posts.status = 'published'
    )
    or (select public.is_owner())
  );

create policy post_tags_insert on public.post_tags
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy post_tags_update on public.post_tags
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy post_tags_delete on public.post_tags
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- post_revisions — owner only, including select
-- -----------------------------------------------------------------------------
create policy post_revisions_select on public.post_revisions
  for select
  to authenticated
  using ((select public.is_owner()));

create policy post_revisions_insert on public.post_revisions
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy post_revisions_update on public.post_revisions
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy post_revisions_delete on public.post_revisions
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- media_assets — metadata is public; file bytes are gated in storage if needed
-- -----------------------------------------------------------------------------
create policy media_assets_select on public.media_assets
  for select
  to anon, authenticated
  using (true);

create policy media_assets_insert on public.media_assets
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy media_assets_update on public.media_assets
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy media_assets_delete on public.media_assets
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- site_settings — singleton already seeded
-- -----------------------------------------------------------------------------
create policy site_settings_select on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy site_settings_insert on public.site_settings
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy site_settings_update on public.site_settings
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy site_settings_delete on public.site_settings
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- storage.objects — public read of the media bucket; owner writes
-- Additive policies only; do not drop supabase defaults on other buckets.
-- -----------------------------------------------------------------------------
create policy media_objects_select on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy media_objects_insert on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (select public.is_owner())
  );

create policy media_objects_update on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'media'
    and (select public.is_owner())
  )
  with check (
    bucket_id = 'media'
    and (select public.is_owner())
  );

create policy media_objects_delete on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (select public.is_owner())
  );

-- -----------------------------------------------------------------------------
-- Table privileges. Newer Supabase does not auto-expose public tables.
-- Anon is select-only. Profiles insert is trigger-only (no client INSERT grant).
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.posts,
  public.tags,
  public.post_tags,
  public.profiles,
  public.media_assets,
  public.site_settings
to anon, authenticated;

grant select on public.post_revisions to authenticated;

grant update, delete on public.profiles to authenticated;

grant insert, update, delete on
  public.posts,
  public.tags,
  public.post_tags,
  public.post_revisions,
  public.media_assets,
  public.site_settings
to authenticated;
