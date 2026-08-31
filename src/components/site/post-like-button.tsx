"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

import { togglePostLike } from "@/lib/actions/likes";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

export function PostLikeButton({
  postId,
  likeCount,
}: {
  postId: string;
  likeCount: number;
}) {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load(userId: string | undefined) {
      if (!userId) {
        if (!cancelled) {
          setSignedIn(false);
          setLiked(false);
        }
        return;
      }

      const { data } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (!cancelled) {
        setLiked(Boolean(data));
        setSignedIn(true);
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      void load(data.user?.id);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user?.id);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, [postId]);

  if (signedIn === null) {
    return <span>{formatCount(likeCount, "like")}</span>;
  }

  if (!signedIn) {
    const next = `/login?next=${encodeURIComponent(pathname)}`;
    return (
      <span>
        <span>{formatCount(likeCount, "like")}</span>
        <span aria-hidden="true"> · </span>
        <Link href={next} className="text-accent underline underline-offset-4">
          Sign in to like
        </Link>
      </span>
    );
  }

  function onToggle() {
    if (pending) {
      return;
    }

    const previousLiked = liked;
    const previousCount = count;
    const nextLiked = !previousLiked;
    const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setCount(nextCount);

    startTransition(async () => {
      const result = await togglePostLike(postId);

      if (!result.success) {
        toast.error(result.error);
        setLiked(previousLiked);
        setCount(previousCount);
        return;
      }

      setLiked(result.liked);
      if (result.liked !== nextLiked) {
        setCount(Math.max(0, previousCount + (result.liked ? 1 : -1)));
      }
    });
  }

  return (
    <span>
      <span>{formatCount(count, "like")}</span>
      <span aria-hidden="true"> · </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        aria-busy={pending}
        aria-pressed={liked}
        onClick={onToggle}
        className="h-auto min-h-0 px-0 py-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        {liked ? "Liked" : "Like"}
      </Button>
    </span>
  );
}
