# Cursor config

Rules = invariants. Skills = procedures. Agents = read-only reviewers. No `CONTEXT.md` — map is `rules/project.mdc`, long form is `docs/`.

```
.cursor/
  rules/     {topic}.mdc
  skills/    {name}/SKILL.md
  agents/    blog-*-reviewer.md  (Task subagent_type — do not rename)
  hooks.json
```

Always-on: `project`, `guidelines`, `subagents`. Path-scoped: `testing`, `ui`, `database`, `actions`, `content`, `seo`.

## Skills

**User-invoked** (`disable-model-invocation: true`): `handoff`

**Model-invoked:** `grill`, `tdd`, `diagnose`, `delivery-team`, `migrate`, `deploy`, `write-post`, `design`, `performance`, `seo`

## Reviewers

`blog-code-reviewer`, `blog-db-reviewer`, `blog-verifier`, `blog-performance-reviewer`, `blog-content-reviewer`, `blog-product-reviewer` — when to launch them is in `delivery-team`.
