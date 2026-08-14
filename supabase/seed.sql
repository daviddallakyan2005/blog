insert into public.site_settings (id, display_name, tagline)
values (1, 'David Dallakyan', '')
on conflict (id) do nothing;

insert into public.tags (slug, name)
values
  ('typescript', 'TypeScript'),
  ('postgres', 'Postgres'),
  ('nextjs', 'Next.js')
on conflict (slug) do nothing;
