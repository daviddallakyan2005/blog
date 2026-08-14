import type { VisibleComment } from "@/lib/data/comments";
import { formatPostDate } from "@/lib/format";

import { CommentForm } from "./comment-form";

function authorLabel(author: VisibleComment["author"]): string {
  return author?.display_name || author?.github_username || "Anonymous";
}

function CommentItem({ comment }: { comment: VisibleComment }) {
  const date = formatPostDate(comment.created_at);
  const displayName = comment.author?.display_name?.trim();
  const handle = comment.author?.github_username?.trim() || null;

  return (
    <article>
      <header className="flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-medium">{authorLabel(comment.author)}</span>
        {displayName && handle ? (
          <span className="text-muted-foreground">@{handle}</span>
        ) : null}
        {date ? (
          <time
            className="text-muted-foreground"
            dateTime={comment.created_at ?? undefined}
          >
            {date}
          </time>
        ) : null}
      </header>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
        {comment.body}
      </p>
    </article>
  );
}

export function CommentList({
  comments,
  postId,
}: {
  comments: VisibleComment[];
  postId: string;
}) {
  const topLevel = comments.filter((comment) => !comment.parent_id);
  const replies = new Map<string, VisibleComment[]>();

  for (const comment of comments) {
    if (!comment.parent_id) {
      continue;
    }
    const list = replies.get(comment.parent_id) ?? [];
    list.push(comment);
    replies.set(comment.parent_id, list);
  }

  const orphans = comments.filter(
    (comment) =>
      Boolean(comment.parent_id) &&
      !topLevel.some((parent) => parent.id === comment.parent_id),
  );

  if (topLevel.length === 0 && orphans.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No comments yet. Be the first to write one.
      </p>
    );
  }

  return (
    <ol className="mt-6 space-y-8">
      {topLevel.map((comment) => (
        <li key={comment.id}>
          <CommentItem comment={comment} />
          {(replies.get(comment.id) ?? []).length > 0 ? (
            <ol className="mt-4 space-y-4 border-l border-border pl-4 sm:pl-6">
              {(replies.get(comment.id) ?? []).map((reply) => (
                <li key={reply.id}>
                  <CommentItem comment={reply} />
                </li>
              ))}
            </ol>
          ) : null}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              Reply
            </summary>
            <div className="mt-3">
              <CommentForm postId={postId} parentId={comment.id} />
            </div>
          </details>
        </li>
      ))}
      {orphans.map((comment) => (
        <li key={comment.id}>
          <CommentItem comment={comment} />
        </li>
      ))}
    </ol>
  );
}
