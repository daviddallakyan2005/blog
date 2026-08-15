-- Public catalog of the owner's GitHub pull request snapshots.

create table public.github_pull_requests (
  id uuid primary key default gen_random_uuid(),
  github_id bigint not null unique,
  repo text not null,
  number int not null,
  unique (repo, number),
  title text not null,
  html_url text not null,
  state text not null check (state in ('open', 'closed')),
  merged boolean not null default false,
  draft boolean not null default false,
  review_decision text null check (
    review_decision is null
    or review_decision in ('APPROVED', 'CHANGES_REQUESTED', 'REVIEW_REQUIRED')
  ),
  issue_comments int not null default 0 check (issue_comments >= 0),
  review_comments int not null default 0 check (review_comments >= 0),
  github_updated_at timestamptz not null,
  github_created_at timestamptz not null,
  closed_at timestamptz,
  merged_at timestamptz,
  synced_at timestamptz not null default now()
);

create index github_pull_requests_github_updated_at_idx
  on public.github_pull_requests (github_updated_at desc);

alter table public.github_pull_requests enable row level security;

-- -----------------------------------------------------------------------------
-- github_pull_requests — public catalog, owner writes
-- -----------------------------------------------------------------------------
create policy github_pull_requests_select on public.github_pull_requests
  for select
  to anon, authenticated
  using (true);

create policy github_pull_requests_insert on public.github_pull_requests
  for insert
  to authenticated
  with check ((select public.is_owner()));

create policy github_pull_requests_update on public.github_pull_requests
  for update
  to authenticated
  using ((select public.is_owner()))
  with check ((select public.is_owner()));

create policy github_pull_requests_delete on public.github_pull_requests
  for delete
  to authenticated
  using ((select public.is_owner()));

grant select on public.github_pull_requests to anon, authenticated;

grant insert, update, delete on public.github_pull_requests to authenticated;
