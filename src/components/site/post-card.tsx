import Link from "next/link";

import { TagPill } from "@/components/site/tag-pill";
import type { PublishedPostListItem } from "@/lib/data/types";
import { formatPostDate, formatReadingTime } from "@/lib/format";
import { postPath } from "@/lib/seo/site";

export function PostCard({ post }: { post: PublishedPostListItem }) {
  const href = postPath(post.slug);
  const date = formatPostDate(post.published_at);

  return (
    <article className="border-b border-border/80 py-8 first:pt-0 last:border-b-0">
      <h2 className="text-xl font-semibold tracking-tight">
        <Link href={href} className="hover:text-accent">
          {post.title}
        </Link>
      </h2>
      {post.summary ? (
        <p className="mt-2 text-muted-foreground">{post.summary}</p>
      ) : null}
      <p className="mt-3 text-sm text-muted-foreground">
        {date ? (
          <time dateTime={post.published_at ?? undefined}>{date}</time>
        ) : null}
        {date ? <span aria-hidden="true"> · </span> : null}
        <span>{formatReadingTime(post.reading_minutes)}</span>
      </p>
      {post.tags.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <li key={tag.id}>
              <TagPill name={tag.name} slug={tag.slug} />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
