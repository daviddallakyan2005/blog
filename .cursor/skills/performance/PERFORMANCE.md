# Blog performance reference

Fast correct reads. Not cleverness.

## Evidence

- Server: route timing, Vercel logs.
- Database: query count + `EXPLAIN (ANALYZE, BUFFERS)` on local data.
- Client: network waterfall, transferred JS, LCP on an article.
- Record the same metric before and after.

## Cache

Public loaders in `src/lib/data/` use `'use cache'`, `cacheTag`, and `cacheLife("hours")` with the cookie-less anon client.

| Tag | Bust from |
| --- | --- |
| `posts`, `post:${slug}`, `tags` | post actions |
| `projects`, `project:${slug}` | project actions |
| `timeline` | timeline actions |
| `settings` | settings actions |
| `comments`, `comments:${postId}` | comment actions |

`next.config.ts` sets `cacheComponents: true`. After a mutation, `updateTag` every affected tag. Do not `revalidatePath` the whole tree unless a path is not tag-covered (comments currently also `revalidatePath` when needed).

Never put `cookies()` / the session client inside a cached function.

## Waterfalls

```ts
const [articles, notes] = await Promise.all([
  getPublishedArticles(),
  getPublishedNotes(),
]);
```

Start independent work together. Layouts should not sequentially refetch settings the page already needs if one cached helper suffices.

## Database

- Select list/detail column sets (`POST_LIST_COLUMNS` / `POST_DETAIL_COLUMNS`).
- Paginate or cap lists.
- Indexes already exist on `(status, published_at)`, `kind`, `search_vector`, project featured/sort. Add indexes only for new predicates.
- `search_posts` is SECURITY DEFINER and published-only — do not reimplement search in the app with a broad `ilike` scan.

## Regions

Vercel **fra1**, Supabase **eu-central-1**. Do not add a US-only image or search service on the article path.

## Client

Public article pages stay RSC + sanitized HTML. Keep the markdown editor and studio chrome off the public bundle. `next/font` for Geist. Covers through existing media helpers, not raw mega-images.
