import { formatDistanceToNow } from "date-fns";

import { CommentModerationActions } from "@/components/studio/comment-moderation-actions";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Comments",
};

type PendingRow = {
  id: string;
  body: string;
  created_at: string | null;
  post_id: string;
  profiles:
    | { display_name: string | null; github_username: string | null }
    | { display_name: string | null; github_username: string | null }[]
    | null;
  posts:
    | { title: string; slug: string }
    | { title: string; slug: string }[]
    | null;
};

function first<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function StudioCommentsPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data } = await supabase
    .from("comments")
    .select(
      "id, body, created_at, post_id, profiles!comments_author_id_fkey (display_name, github_username), posts!comments_post_id_fkey (title, slug)",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const list = (data as PendingRow[] | null) ?? [];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Comments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {list.length} pending {list.length === 1 ? "comment" : "comments"}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing waiting for review.
        </p>
      ) : (
        <ul className="space-y-4">
          {list.map((comment) => {
            const author = first(comment.profiles);
            const post = first(comment.posts);
            const name =
              author?.display_name || author?.github_username || "Anonymous";
            const when = comment.created_at
              ? formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                })
              : null;

            return (
              <li
                key={comment.id}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p className="font-medium">{name}</p>
                  {when ? (
                    <p className="text-muted-foreground">{when}</p>
                  ) : null}
                </div>
                {post ? (
                  <p className="text-xs text-muted-foreground">
                    On {post.title}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {comment.body}
                </p>
                <CommentModerationActions id={comment.id} />
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
