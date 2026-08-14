import { NewPostForm } from "@/components/studio/new-post-form";
import { requireOwner } from "@/lib/auth";

export default async function NewPostPage() {
  await requireOwner();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New post</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start a draft, then write in the editor.
        </p>
      </div>
      <NewPostForm />
    </main>
  );
}
