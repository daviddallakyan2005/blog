delete from public.posts where kind = 'note';
drop index if exists public.posts_kind_idx;
alter table public.posts drop column kind;

drop function if exists public.search_posts(text, integer);

create function public.search_posts(q text, limit_n integer default 20)
returns table (
  slug text,
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
