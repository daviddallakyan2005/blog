# Design

Typography-first reading site. Tokens live in `src/app/globals.css`. Agent checklist: `.cursor/skills/frontend-product-design/DESIGN.md`.

## Principles

- Long-form first. Body measure **68ch** (`max-w-prose`).
- Warm paper (light) and warm ink (dark). Accent is a quiet blue, not a growth-dashboard purple.
- Geist Sans / Geist Mono via `next/font`. Do not casually replace them.
- Dark mode is a **class toggle** on `html` (`ThemeToggle` + inline init in the root layout). Not media-only.
- Reuse `src/components/ui/` and existing site/studio/prose components.

## Surfaces

- **Public:** header, footer, post list/article, tags, projects, about/timeline, search. Calm chrome; the article is the product.
- **Studio:** functional owner tool. Same tokens, denser layout, `noindex`.
- **OG:** 1200×630 paper card from `src/components/seo/og-image.tsx`.

## A11y

Semantic headings, labels, visible focus, contrast on both themes, `prefers-reduced-motion`, pending state on async buttons.
