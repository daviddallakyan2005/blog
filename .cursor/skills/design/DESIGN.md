# Blog design reference

Live UI and `src/app/globals.css` are authoritative. This file grounds agents; it is not a frozen spec.

## Product

A personal technical blog. Readers come for articles, notes, projects, and an about/timeline page. Studio is a quiet owner tool, not the public brand.

Feel: calm, typographic, paper-and-ink. Not a SaaS dashboard.

## Visual system

- Tailwind v4, CSS-first. Tokens in `src/app/globals.css` (`@theme inline`, OKLCH).
- **Measure:** `--max-width-prose: 68ch`. Body line-height ~1.7.
- **Type:** Geist Sans / Geist Mono via `next/font` on the root layout. Do not swap fonts as incidental UI work.
- **Color:** warm paper light, warm ink dark. Accent is a restrained blue. Semantic tokens only (`background`, `foreground`, `muted`, `accent`, `border`, `card`).
- **Dark mode:** `html.dark` class. `@custom-variant dark (&:where(.dark, .dark *));`. Inline script in `src/app/layout.tsx` reads `localStorage.theme` / `prefers-color-scheme` before paint. `ThemeToggle` writes the class and storage.
- **Primitives:** `src/components/ui/` (shadcn/Radix). Site chrome in `src/components/site/`. Studio in `src/components/studio/`. Prose/TOC in `src/components/prose/`.

## Canonical files

- `src/app/globals.css`, `src/app/layout.tsx`, `src/app/(site)/layout.tsx`
- `src/components/site/header.tsx`, `footer.tsx`, `theme-toggle.tsx`, `post-article.tsx`, `post-card.tsx`
- `src/components/prose/rendered-html.tsx`, `toc.tsx`
- `src/components/seo/og-image.tsx` (warm paper OG, 1200×630)
- `src/app/studio/layout.tsx`

## Quality baseline

- Semantic headings and landmarks.
- Visible focus and 4.5:1 body contrast on both themes.
- `prefers-reduced-motion` respected for non-essential motion.
- Code blocks use Shiki github-light / github-dark and must remain readable in both themes.
