import { notFound } from "next/navigation";

import { ProjectForm } from "@/components/studio/project-form";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { projectIdSchema } from "@/lib/validations/projects.schema";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  await requireOwner();
  const { id } = await params;

  if (!projectIdSchema.safeParse({ id }).success) {
    notFound();
  }

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!project) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {project.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{project.slug}</p>
      </div>
      <ProjectForm project={project} />
    </main>
  );
}
