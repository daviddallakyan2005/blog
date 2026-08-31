"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";

import { togglePostLike } from "@/lib/actions/likes";
import { formatCount } from "@/lib/format";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chipClassName =
  "shrink-0 text-foreground motion-reduce:transition-none";

function LikeChipContent({
  liked,
  count,
}: {
  liked: boolean;
  count: number;
}) {
  return (
    <>
      <Heart
        aria-hidden="true"
        className={cn(
          liked && "fill-current text-like",
          "motion-safe:transition-colors",
        )}
      />
      <span>{liked ? "Liked" : "Like"}</span>
      <span className="tabular-nums">{count}</span>
    </>
  );
}

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
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-busy="true"
        aria-label={formatCount(likeCount, "like")}
        className={cn(chipClassName, "disabled:opacity-100")}
      >
        <LikeChipContent liked={false} count={likeCount} />
      </Button>
    );
  }

  if (!signedIn) {
    const next = `/login?next=${encodeURIComponent(pathname)}`;
    return (
      <Button variant="outline" size="sm" className={chipClassName} asChild>
        <Link
          href={next}
          aria-label={`Sign in to like. ${formatCount(likeCount, "like")}`}
        >
          <LikeChipContent liked={false} count={likeCount} />
        </Link>
      </Button>
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
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      aria-busy={pending}
      aria-pressed={liked}
      aria-label={`${liked ? "Liked" : "Like"}, ${formatCount(count, "like")}`}
      onClick={onToggle}
      className={chipClassName}
    >
      <LikeChipContent liked={liked} count={count} />
    </Button>
  );
}
