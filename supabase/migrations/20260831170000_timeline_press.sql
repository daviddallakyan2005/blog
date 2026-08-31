-- Add timeline kind `press` (profiles, interviews, podcasts, news about the owner).
-- Existing policies already cover all timeline_entries rows; no new RLS or grants.

alter table public.timeline_entries drop constraint timeline_entries_kind_check;

alter table public.timeline_entries
  add constraint timeline_entries_kind_check
  check (kind in ('role', 'education', 'talk', 'award', 'oss_contribution', 'press'));

insert into public.timeline_entries (
  kind,
  title,
  org,
  org_url,
  start_date,
  end_date,
  is_current,
  description_md,
  description_html,
  highlights,
  sort_order
)
select
  'press',
  'Empowering Journey in Computer Science',
  'AUA Newsroom',
  'https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/',
  '2025-03-20',
  '2025-03-20',
  false,
  'Student profile on studying computer science at AUA, a data-analyst internship at Wirestock, and research with Dr. Nelson Baloian on examination schedules.',
  '<p>Student profile on studying computer science at AUA, a data-analyst internship at Wirestock, and research with Dr. Nelson Baloian on examination schedules.</p>',
  '{}'::text[],
  40
where not exists (
  select 1
  from public.timeline_entries
  where org_url = 'https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/'
);
