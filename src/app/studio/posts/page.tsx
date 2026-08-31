import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/studio/status-badge";
import { Button } from "@/components/ui/button";

export default async function StudioPostsPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, status, updated_at, published_at")
    .order("updated_at", { ascending: false });

  const list = posts ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} {list.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/posts/new">New post</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Create a draft to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((post) => (
                <tr key={post.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/studio/posts/${post.id}/edit`}
                      className="font-medium hover:text-accent"
                    >
                      {post.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(post.updated_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
