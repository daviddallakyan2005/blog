import { Suspense } from "react";

import { CommentSection } from "@/components/comments/comment-section";
import { CoverImage } from "@/components/site/cover-image";
import { PostLikeButton } from "@/components/site/post-like-button";
import { RecordPostView } from "@/components/site/record-post-view";
import { TagPill } from "@/components/site/tag-pill";
import { RenderedHtml } from "@/components/prose/rendered-html";
import { Toc } from "@/components/prose/toc";
import type { PublishedPost } from "@/lib/data/types";
import { formatCount, formatPostDate, formatReadingTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PostArticle({
  post,
  showToc,
}: {
  post: PublishedPost;
  showToc: boolean;
}) {
  const date = formatPostDate(post.published_at);
  const toc = showToc ? post.toc_json : [];
  const hasToc = toc.length > 0;

  return (
    <div
      className={cn(
        "mx-auto px-6 py-16",
        hasToc
          ? "max-w-6xl lg:grid lg:grid-cols-[minmax(0,68ch)_14rem] lg:justify-center lg:gap-16"
          : "max-w-prose",
      )}
    >
      <article>
        <header>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 text-sm text-muted-foreground">
            {date ? (
              <time dateTime={post.published_at ?? undefined}>{date}</time>
            ) : null}
            {date ? <span aria-hidden="true"> · </span> : null}
            <span>{formatReadingTime(post.reading_minutes)}</span>
            <span aria-hidden="true"> · </span>
            <span>{formatCount(post.view_count, "view")}</span>
            <span aria-hidden="true"> · </span>
            <PostLikeButton postId={post.id} likeCount={post.like_count} />
          </div>
          <RecordPostView postId={post.id} />
          {post.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <li key={tag.id}>
                  <TagPill name={tag.name} slug={tag.slug} />
                </li>
              ))}
            </ul>
          ) : null}
        </header>
        {post.cover_path ? (
          <div className="mt-8">
            <CoverImage path={post.cover_path} alt="" />
          </div>
        ) : null}
        <div className="mt-10">
          <RenderedHtml html={post.body_html} />
        </div>
      </article>
      {hasToc ? (
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Toc items={toc} />
          </div>
        </aside>
      ) : null}
      <div
        className={cn(
          "mt-16 border-t border-border pt-10",
          hasToc && "lg:col-span-2",
        )}
      >
        <div className="max-w-prose">
          <Suspense
            fallback={
              <p className="text-sm text-muted-foreground">Loading comments…</p>
            }
          >
            <CommentSection postId={post.id} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
