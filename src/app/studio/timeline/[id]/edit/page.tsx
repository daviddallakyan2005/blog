import { notFound } from "next/navigation";

import { TimelineForm } from "@/components/studio/timeline-form";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { timelineIdSchema } from "@/lib/validations/timeline.schema";

type EditTimelinePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTimelinePage({
  params,
}: EditTimelinePageProps) {
  await requireOwner();
  const { id } = await params;

  if (!timelineIdSchema.safeParse({ id }).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: entry } = await supabase
    .from("timeline_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!entry) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {entry.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{entry.kind}</p>
      </div>
      <TimelineForm entry={entry} />
    </main>
  );
}
