---
name: seo
description: Audits metadata, Open Graph, sitemap, RSS, and JSON-LD for the public blog. Use when adding routes, changing site URL, or reviewing discoverability.
---

# SEO

Read `.cursor/rules/seo.mdc` and score the public surface against it.

Helpers: `src/lib/seo/site.ts`, `src/components/seo/json-ld.tsx`, `src/components/seo/og-image.tsx`.

## When the contract changes

New public collection → sitemap + optional RSS + JSON-LD in the same change. New domain → `NEXT_PUBLIC_SITE_URL` on Vercel and the GitHub OAuth callback.

Report gaps with file/line and the missing public URL.
