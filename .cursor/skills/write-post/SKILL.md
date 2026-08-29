---
name: write-post
description: Author a blog post from outline through content/drafts/, editorial review, then publish in /studio. Use when drafting articles or notes.
---

# Write a post

Publishing is a studio action against Postgres. Pipeline invariants: `content` rule. The git repo only holds local scratch.

## Workflow

1. **Outline** — kind (`article` | `note`), working title, slug, summary, headings, tags. Confirm facts and code samples. If kind, audience, or claims are still open, `grill` first.
2. **Draft** — markdown under `content/drafts/` (gitignored except `README.md`). Do not commit draft bodies.
3. **Editorial review** — `blog-content-reviewer` on `cursor-grok-4.6-high`.
4. **Publish in studio** — owner pastes or edits, sets tags/cover, publishes. The action persists HTML/toc/reading time and `updateTag`s `posts`, `post:${slug}`, `tags`.

## Constraints

- Do not add a markdown-from-git publish path.
- After publish, sitemap and `/feed.xml` pick up the row on the next cache miss / tag bust.
