---
name: performance-engineering
description: Measures and improves blog latency using cacheTag/updateTag, no waterfalls, and fra1/eu-central-1 locality. Use for slow routes, cache bugs, extra Supabase queries, or optimization requests.
---

# Performance engineering

Read [PERFORMANCE.md](PERFORMANCE.md) before substantive performance work or review.

## Workflow

1. Name the metric (TTFB, query count, cache hit, bundle, LCP).
2. Baseline with the narrowest tool. Do not guess the bottleneck from code shape alone.
3. Trace layout → page → `src/lib/data/*` or actions → Supabase → HTML.
4. Rank:
   - remove serial waterfalls (`Promise.all`);
   - keep public reads on `'use cache'` + anon client;
   - fix missing `updateTag` after writes;
   - cut columns, N+1, and unbounded lists;
   - keep Vercel `fra1` next to Supabase `eu-central-1`.
5. Smallest change that preserves auth, freshness, and RLS.
6. Re-measure. Label unmeasured impact as a hypothesis.

## Guardrails

- Do not cache owner/session data on public tags (`posts`, `settings`, …).
- Do not put the cookie client inside `'use cache'` functions.
- Do not add indexes or dependencies from intuition alone.
- Parallelize only independent work.
