import { CommentForm } from "@/components/comments/comment-form";
import { CommentList } from "@/components/comments/comment-list";
import { getVisibleComments } from "@/lib/data/comments";

export async function CommentSection({ postId }: { postId: string }) {
  const comments = await getVisibleComments(postId);

  return (
    <section aria-labelledby="comments-heading">
      <h2
        id="comments-heading"
        className="text-xl font-semibold tracking-tight"
      >
        Comments
      </h2>
      <CommentList comments={comments} postId={postId} />
      <div className="mt-8">
        <CommentForm postId={postId} />
      </div>
    </section>
  );
}
