-- Projects catalog and about-page timeline.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description_md text not null default '',
  description_html text not null default '',
  repo_url text,
  homepage_url text,
  primary_language text,
  tech text[] not null default '{}',
  role text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  featured boolean not null default false,
  sort_order int not null default 0,
  stars int,
  forks int,
  stars_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_featured_sort_order_name_idx
  on public.projects (featured desc, sort_order, name);

create table public.timeline_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('role', 'education', 'talk', 'award', 'oss_contribution')),
  title text not null,
  org text,
  org_url text,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description_md text not null default '',
  description_html text not null default '',
  highlights text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create trigger set_updated_at
before update on public.timeline_entries
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.timeline_entries enable row level security;

-- -----------------------------------------------------------------------------
-- projects — public catalog, owner writes
-- -----------------------------------------------------------------------------
create policy projects_select on public.projects
  for select
  to anon, authenticated
  using (true);

create policy projects_insert on public.projects
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy projects_update on public.projects
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy projects_delete on public.projects
  for delete
  to authenticated
  using ((select public.is_owner()));

-- -----------------------------------------------------------------------------
-- timeline_entries — public about page, owner writes
-- -----------------------------------------------------------------------------
create policy timeline_entries_select on public.timeline_entries
  for select
  to anon, authenticated
  using (true);

create policy timeline_entries_insert on public.timeline_entries
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy timeline_entries_update on public.timeline_entries
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy timeline_entries_delete on public.timeline_entries
  for delete
  to authenticated
  using ((select public.is_owner()));

grant select on
  public.projects,
  public.timeline_entries
to anon, authenticated;

grant insert, update, delete on
  public.projects,
  public.timeline_entries
to authenticated;
