---
name: performance
description: Measures and improves blog latency using cacheTag/updateTag, no waterfalls, and fra1/eu-central-1 locality. Use for slow routes, cache bugs, extra Supabase queries, or optimization requests.
---

# Performance

Read [PERFORMANCE.md](PERFORMANCE.md) before substantive work or review.

## Workflow

1. Name the metric (TTFB, query count, cache hit, bundle, LCP).
2. Baseline with the narrowest tool. Do not guess the bottleneck from code shape alone.
3. Trace layout → page → `src/lib/data/*` or actions → Supabase → HTML.
4. Rank: waterfalls (`Promise.all`) → public `'use cache'` + anon client → missing `updateTag` → columns/N+1/unbounded lists → keep `fra1` next to `eu-central-1`.
5. Smallest change that preserves auth, freshness, and RLS.
6. Re-measure. Label unmeasured impact as a hypothesis.

Do not cache owner/session data on public tags. Do not put the cookie client inside `'use cache'`. Parallelize only independent work.
