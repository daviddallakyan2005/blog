import { PostCard } from "@/components/site/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PublishedPostListItem } from "@/lib/data/types";

export function PostList({
  posts,
  empty,
}: {
  posts: PublishedPostListItem[];
  empty: string;
}) {
  if (posts.length === 0) {
    return <p className="mt-10 text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="mt-10">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

export function PostListSkeleton() {
  return (
    <div className="mt-10 space-y-8" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="space-y-3">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
