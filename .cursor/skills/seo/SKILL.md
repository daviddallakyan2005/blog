---
name: seo
description: Audits metadata, Open Graph, sitemap, RSS, JSON-LD, and Google Search Console for the public blog. Use when adding or removing public routes, changing site URL, publishing, or reviewing discoverability.
---

# SEO

Read `.cursor/rules/seo.mdc` and score the public surface against it.

Helpers: `src/lib/seo/site.ts`, `src/components/seo/json-ld.tsx`, `src/components/seo/og-image.tsx`.

## When the contract changes

New public collection → sitemap + optional RSS + JSON-LD in the same change. New domain → `NEXT_PUBLIC_SITE_URL` on Vercel and the GitHub OAuth callback.

Report gaps with file/line and the missing public URL.

## Google Search Console

Domain property `daviddallakyan.com` (`sc-domain:daviddallakyan.com`), account `daviddallakyan2005@gmail.com`. DNS-verified. No Search Console API in this repo — use the open Search Console browser tab.

The live sitemap is the source of truth. GSC only re-reads it. Submit the **full** URL `https://daviddallakyan.com/sitemap.xml` (a relative path fails on a domain property).

Run **after production is serving the new URLs** (studio publish cache bust, or `deploy` live smoke). Do not inspect localhost.

1. GET `https://daviddallakyan.com/sitemap.xml`. It must match `seo.mdc`: published articles and projects only. No drafts, `/notes`, `/tags`, `/search`, `/about`, `/cv`, studio.
2. Resubmit that sitemap URL. Expect Success. "Discovered pages" can stay high until Google's next read.
3. URL Inspection:
   - New public 200 → **Request indexing** once.
   - Removed URL → inspect only. Live should be 404 (or the redirect we shipped). Do **not** request indexing.
4. Removals only if a removed URL is actually **indexed**. Skip if "unknown to Google".

Do not request indexing of `/studio`, `/login`, `/denied`, `/auth`, or `/articles?q=` / `?tag=` (`noindex`).
