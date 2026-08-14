import { NewProjectForm } from "@/components/studio/new-project-form";
import { requireOwner } from "@/lib/auth";

export default async function NewProjectPage() {
  await requireOwner();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New project</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a project, then fill in the details.
        </p>
      </div>
      <NewProjectForm />
    </main>
  );
}
