import Link from "next/link";

import { requireOwner } from "@/lib/auth";
import { formatTimelineRange } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const KIND_LABEL: Record<string, string> = {
  role: "Role",
  education: "Education",
  talk: "Talk",
  award: "Award",
  oss_contribution: "Open source",
  press: "Elsewhere",
};

export default async function StudioTimelinePage() {
  await requireOwner();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("timeline_entries")
    .select(
      "id, kind, title, org, start_date, end_date, is_current, sort_order",
    )
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: false });

  const list = entries ?? [];

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Roles, education, talks, elsewhere, and other about-page entries.
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/timeline/new">New entry</Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No timeline entries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 font-medium">Title</th>
                <th className="px-4 py-2.5 font-medium">Kind</th>
                <th className="px-4 py-2.5 font-medium">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((entry) => {
                const range = formatTimelineRange(entry) ?? "—";

                return (
                  <tr key={entry.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/studio/timeline/${entry.id}/edit`}
                        className="font-medium hover:text-accent"
                      >
                        {entry.title}
                      </Link>
                      {entry.org ? (
                        <p className="text-xs text-muted-foreground">
                          {entry.org}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">
                        {KIND_LABEL[entry.kind] ?? entry.kind}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{range}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
