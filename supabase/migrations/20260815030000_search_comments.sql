-- Full-text search on published posts, comments with moderation + rate limit.

-- -----------------------------------------------------------------------------
-- posts.search_vector
-- -----------------------------------------------------------------------------
alter table public.posts
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body_md, '')), 'C')
  ) stored;

create index posts_search_vector_idx on public.posts using gin (search_vector);

-- -----------------------------------------------------------------------------
-- search_posts — published posts only (SECURITY DEFINER, never drafts)
-- -----------------------------------------------------------------------------
create or replace function public.search_posts(q text, limit_n integer default 20)
returns table (
  slug text,
  kind text,
  title text,
  snippet text,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.slug,
    p.kind,
    p.title,
    ts_headline(
      'english',
      coalesce(p.body_md, ''),
      plainto_tsquery('english', q),
      'MaxFragments=1, MaxWords=35, MinWords=15'
    ) as snippet,
    ts_rank(p.search_vector, plainto_tsquery('english', q))::real as rank
  from public.posts p
  where p.status = 'published'
    and p.search_vector @@ plainto_tsquery('english', q)
  order by rank desc, p.published_at desc nulls last
  limit least(greatest(coalesce(limit_n, 20), 1), 50);
$$;

revoke all on function public.search_posts(text, integer) from public;
grant execute on function public.search_posts(text, integer) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'pending' check (status in ('visible', 'pending', 'hidden', 'spam')),
  created_at timestamptz default now()
);

create index comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index comments_status_idx on public.comments (status);

alter table public.comments enable row level security;

create policy comments_select on public.comments
  for select
  to anon, authenticated
  using (
    status = 'visible'
    or (select public.is_owner())
    or author_id = (select auth.uid())
  );

create policy comments_insert on public.comments
  for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and status = 'pending'
  );

create policy comments_update on public.comments
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy comments_delete on public.comments
  for delete
  to authenticated
  using ((select public.is_owner()));

grant select on public.comments to anon, authenticated;
grant insert, update, delete on public.comments to authenticated;

-- -----------------------------------------------------------------------------
-- Rate limit: max 5 comments per author in the last hour
-- -----------------------------------------------------------------------------
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

revoke all on function public.enforce_comment_rate_limit() from public;

create trigger comments_rate_limit
  before insert on public.comments
  for each row
  execute function public.enforce_comment_rate_limit();
