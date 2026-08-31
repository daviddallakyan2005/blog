-- Press/elsewhere entries are a published date, not a range.
update public.timeline_entries
set
  end_date = null,
  is_current = false
where kind = 'press';
