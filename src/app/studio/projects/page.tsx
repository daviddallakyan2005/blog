import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function StudioProjectsPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, slug, status, featured, updated_at")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const list = projects ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {list.length} {list.length === 1 ? "project" : "projects"}
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/projects/new">New project</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing here yet. Add a project to get started.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((project) => (
                <tr key={project.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/studio/projects/${project.id}/edit`}
                      className="font-medium hover:text-accent"
                    >
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {project.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge
                        variant={
                          project.status === "active" ? "default" : "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                      {project.featured ? (
                        <Badge variant="secondary">Featured</Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDistanceToNow(new Date(project.updated_at), {
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
