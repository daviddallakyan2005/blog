"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteComment, moderateComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/button";

export function CommentModerationActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<
      { success: true } | { success: false; error: string }
    >,
    successMessage: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(successMessage);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          run(() => moderateComment(id, "visible"), "Comment approved")
        }
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          run(() => moderateComment(id, "hidden"), "Comment hidden")
        }
      >
        Hide
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => run(() => moderateComment(id, "spam"), "Marked as spam")}
      >
        Spam
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending}
        onClick={() => run(() => deleteComment(id), "Comment deleted")}
      >
        Delete
      </Button>
    </div>
  );
}
