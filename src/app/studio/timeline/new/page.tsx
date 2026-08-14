import { TimelineForm } from "@/components/studio/timeline-form";
import { requireOwner } from "@/lib/auth";

export default async function NewTimelinePage() {
  await requireOwner();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New timeline entry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Roles, education, talks, awards, and open-source work.
        </p>
      </div>
      <TimelineForm />
    </main>
  );
}
