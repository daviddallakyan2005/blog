# Blog Cursor configuration

Commit this directory. Cloud and local agents share the same rules, skills, and reviewers.

- `rules/`: always-on project + orchestrator contract, plus path-scoped constraints.
- `skills/`: workflows loaded by description (delivery, migrations, deploy, writing, design, performance, SEO).
- `agents/`: independent read-only reviewers. Every custom agent and every Task launch uses `cursor-grok-4.6-high`.
- `hooks.json`: confirmation gate for mutating linked Supabase or production Vercel.
- `settings.json`: `{ "plugins": {} }`.

## Orchestrator

The main agent plans, briefs disjoint-path implementation subagents, gates with typecheck/test/build, then fans out reviewers. It does not write feature code (small integration fixes only). A reviewer `FAIL` goes back to the owning implementation subagent — the orchestrator does not silently patch.

Every `Task` launch must pass `model: "cursor-grok-4.6-high"` explicitly. Never inherit. Never `composer-2.5-fast`.

## Reviewers

- `blog-code-reviewer` — correctness, regressions, architecture
- `blog-db-reviewer` — migrations, RLS, grants, service-role
- `blog-verifier` — commands and observable evidence
- `blog-performance-reviewer` — cache, waterfalls, regions
- `blog-content-reviewer` — editorial quality, code-sample correctness
- `blog-product-reviewer` — reading UX, mobile, a11y
