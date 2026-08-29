-- pdf-toolbox is a Go/Fyne desktop app, not Python.

update public.projects
set
  primary_language = 'Go',
  tech = '{Go,PDF}'
where slug = 'pdf-toolbox';
