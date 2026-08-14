---
name: write-post
description: Author a blog post from outline through content/drafts/, editorial review, then publish in /studio. Use when drafting articles or notes.
---

# Write a post

Publishing is a studio action against Postgres. The git repo only holds local scratch.

## Workflow

1. **Outline** — kind (`article` | `note`), working title, slug, summary, headings, tags. Confirm facts and the code samples you will show.
2. **Draft** — write markdown under `content/drafts/`. That tree is gitignored except `content/drafts/README.md`. Do not commit draft bodies.
3. **Editorial review** — launch `blog-content-reviewer` with `model: "cursor-grok-4.6-high"`. Fix samples and claims. Preview in studio uses `renderMarkdown` (same as publish).
4. **Publish in studio** — owner signs in at `/studio`, pastes or edits the draft, sets tags/cover, and publishes. The action sanitizes, stores `body_html` / toc / reading time, and `updateTag`s `posts`, `post:${slug}`, `tags`.

## Constraints

- Do not add a markdown-from-git publish path.
- Do not skip sanitize or invent a second renderer for preview.
- Code fences should use languages in the Shiki allowlist in `src/lib/markdown/render.ts`.
- After publish, sitemap and `/feed.xml` pick up the row on the next cache miss / tag bust.
