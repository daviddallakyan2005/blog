import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/studio/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudioDashboardPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, slug, status, updated_at")
    .order("updated_at", { ascending: false });

  const list = posts ?? [];
  const drafts = list.filter((post) => post.status === "draft").length;
  const published = list.filter((post) => post.status === "published").length;
  const recent = list.slice(0, 8);

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drafts, published posts, and recent edits.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{drafts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{published}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3" aria-labelledby="recent-posts-heading">
        <h2 id="recent-posts-heading" className="text-lg font-semibold">
          Recent posts
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts yet.{" "}
            <Link href="/studio/posts/new" className="text-accent underline">
              Create one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {recent.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/studio/posts/${post.id}/edit`}
                  className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <StatusBadge status={post.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
