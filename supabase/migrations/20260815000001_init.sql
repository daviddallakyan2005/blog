create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  github_username text,
  display_name text,
  avatar_url text,
  role text not null default 'reader' check (role in ('owner', 'reader')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  kind text not null check (kind in ('article', 'note')),
  title text not null,
  summary text,
  body_md text not null default '',
  body_html text not null default '',
  toc_json jsonb not null default '[]'::jsonb,
  cover_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  reading_minutes int not null default 0,
  word_count int not null default 0,
  canonical_url text,
  series_id uuid,
  series_order int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_status_published_at_idx on public.posts (status, published_at desc);
create index posts_kind_idx on public.posts (kind);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table public.post_revisions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  title text not null,
  body_md text not null,
  created_at timestamptz not null default now()
);

create index post_revisions_post_id_created_at_idx
  on public.post_revisions (post_id, created_at desc);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,
  alt text,
  width int,
  height int,
  byte_size int,
  created_at timestamptz not null default now()
);

create table public.site_settings (
  id int primary key default 1 check (id = 1),
  display_name text,
  tagline text,
  bio_md text,
  bio_html text,
  avatar_path text,
  social jsonb not null default '{}'::jsonb,
  seo_title text,
  seo_description text,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, display_name, tagline)
values (1, 'David Dallakyan', '');

create trigger set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

create trigger set_updated_at
before update on public.site_settings
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.tags enable row level security;
alter table public.post_tags enable row level security;
alter table public.post_revisions enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;
