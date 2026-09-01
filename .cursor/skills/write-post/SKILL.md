---
name: write-post
description: >-
  Authors long-form technical posts from outline through content/drafts/,
  with colored diagrams, editorial review, then publish in /studio.
  Use when drafting articles, writing a blog post, outlining, revising a
  draft, adding architecture/sequence diagrams, or asking to publish.
---

# Write a post

Publishing is a studio action against Postgres. Pipeline invariants: `content` rule. The git repo only holds local scratch.

## Invariants

1. Drafts live in `content/drafts/` (gitignored except `README.md`). Do not commit draft bodies.
2. Publish in `/studio` against Postgres. **No markdown-from-git publish path.**
3. Preview === publish via `renderMarkdown` in `src/lib/markdown/`. No second renderer.
4. Do not add Mermaid (or any diagram compiler) to the markdown pipeline from this skill.

## Workflow

```
- [ ] 1. Outline — type, title, slug, summary, headings, tags, diagram plan
- [ ] 2. Draft — content/drafts/{slug}.md + figures
- [ ] 3. Editorial review — blog-content-reviewer
- [ ] 4. Publish in studio
```

### 1. Outline

Working title, slug, summary, H2s, tags. Confirm facts and code samples against the repo or cited docs.

**Classify one type** (do not mash them). Default for this blog is a **production post**. Read [craft.md](craft.md) and [teach.md](teach.md) before writing prose.

| Type | Voice | Job |
| --- | --- | --- |
| Production / deep dive | First person of who ran it | Steal a real decision |
| How-to | Second person `you` | Get X done |
| Tutorial | Tutorial `we` | One beginner path |
| Explainer | Why / history | Understanding, not install steps |
| Postmortem | Blameless, UTC | Impact, factors, owned actions |

If audience, claims, versions, or “what we actually ran” are still open, `grill` first. Do not invent anecdotes, numbers, or APIs.

**Diagram plan (required for architecture, control-plane, data-path, and incident posts):** list each figure as `claim → type`. Read [diagrams.md](diagrams.md) before drawing. First figure is the map (context/container) **after the noun paragraph, before the first deep section**.

Stop and confirm the outline (including which diagrams) before drafting if the owner has not already specified it.

### 2. Draft

Write markdown at `content/drafts/{slug}.md`. Keep diagram source and exports in `content/drafts/{slug}/` (`*.d2` / `*.mmd` / `*.svg`). Do not commit them.

- Prose, titles, samples, anti-slop: [craft.md](craft.md)
- High-level then deep dive (teach, then zoom): [teach.md](teach.md)
- Choosing, coloring, and embedding figures: [diagrams.md](diagrams.md)

Code samples must be real enough to compile or run in the stated language. Prefer languages in the Shiki allowlist in `src/lib/markdown/render.ts`.

### 3. Editorial review

Launch `blog-content-reviewer` on `cursor-grok-4.6-high`. Do not treat self-review as a substitute. FAIL → fix the draft → re-review.

### 4. Publish in studio

Owner pastes or edits, sets tags/cover, publishes. The action persists HTML/toc/reading time and `updateTag`s `posts`, `post:${slug}`, `tags`.

Cover images go through media actions + the `media` bucket. Body diagrams: upload SVG/PNG in the studio editor (see [diagrams.md](diagrams.md)); replace any `TO_UPLOAD:` placeholders. Provide real alt text — not the filename stem.

After publish, sitemap and `/feed.xml` pick up the row on the next cache miss / tag bust. Then `seo` is required, not optional: GET the live article URL (200), then **Request indexing** for that URL in Search Console.

## Constraints

- Do not add a markdown-from-git publish path.
- Do not put required steps only in a callout or `<details>`.
- Do not ship a production/architecture post with zero figures when a map would carry the claim. Do not ship a figure that is unlabeled cloud collage.
- Do not use `--`, `---`, `—`, or `–` as punctuation in the post. Details: [craft.md](craft.md).

## Handoffs

| Need | Skill |
| --- | --- |
| Ambiguous audience or unverified claims | `grill` |
| Public metadata / OG / sitemap | `seo` |
| Site chrome around a post | `design` |
| Markdown pipeline, mermaid, sanitize | `delivery-team` (product change, not this skill) |

## Resources

| File | Load when |
| --- | --- |
| [craft.md](craft.md) | Writing or revising prose |
| [teach.md](teach.md) | Drafting or revising so the post teaches (map then zoom) |
| [diagrams.md](diagrams.md) | Architecture, sequence, data-flow, or any figure |
