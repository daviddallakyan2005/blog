"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { createComment } from "@/lib/actions/comments";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({
  postId,
  parentId,
}: {
  postId: string;
  parentId?: string;
}) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) {
        setSignedIn(Boolean(data.user));
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  if (signedIn === null) {
    return <p className="text-sm text-muted-foreground">Checking sign-in…</p>;
  }

  if (!signedIn) {
    const next = `/login?next=${encodeURIComponent(pathname)}`;
    return (
      <p className="text-sm text-muted-foreground">
        <Link href={next} className="text-accent underline underline-offset-4">
          Sign in
        </Link>{" "}
        to leave a comment. Comments are moderated before they appear.
      </p>
    );
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createComment({
        body,
        postId,
        parentId,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setBody("");
      toast.success("Thanks — your comment is awaiting moderation.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={parentId ? `reply-${parentId}` : "comment-body"}>
          {parentId ? "Reply" : "Comment"}
        </Label>
        <Textarea
          id={parentId ? `reply-${parentId}` : "comment-body"}
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          required
          placeholder="Share a thought…"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Comments are moderated and will not appear until approved.
      </p>
      <Button type="submit" disabled={pending || body.trim().length === 0}>
        {pending ? "Submitting…" : parentId ? "Post reply" : "Post comment"}
      </Button>
    </form>
  );
}
