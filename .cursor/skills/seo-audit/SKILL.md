---
name: seo-audit
description: Audits metadata, Open Graph, sitemap, RSS, and JSON-LD for the public blog. Use when adding routes, changing site URL, or reviewing discoverability.
---

# SEO audit

Canonical helpers: `src/lib/seo/site.ts`, `src/components/seo/json-ld.tsx`, `src/components/seo/og-image.tsx`.

## Checklist

1. **Metadata** — root `metadataBase` is `SITE_URL` (`NEXT_PUBLIC_SITE_URL`, no trailing slash). Title template `%s | ${SITE_NAME}`. Description present. Studio routes `robots: noindex`.
2. **Open Graph / Twitter** — `summary_large_image`. Article/note `opengraph-image.tsx` uses `createOgImage` (1200×630). Absolute URLs only.
3. **Sitemap** — `src/app/sitemap.ts` lists `/`, `/articles`, `/notes`, `/tags`, `/about`, `/projects`, `/search`, plus published articles, notes, tags, projects. No drafts, no `/studio`.
4. **Robots** — allow `/`; disallow `/studio`, `/login`, `/denied`, `/auth`; `sitemap` URL set.
5. **RSS** — `/feed.xml` latest published posts, XML-escaped, linked from root `alternates`.
6. **JSON-LD** — `Person` + `WebSite` on the root layout; `BlogPosting` on article/note pages. `<` escaped as `\\u003c`.

## When the contract changes

New public collection → sitemap + optional RSS + JSON-LD in the same PR. New domain → update `NEXT_PUBLIC_SITE_URL` on Vercel and the GitHub OAuth callback.

Report gaps with file/line and the missing public URL.
