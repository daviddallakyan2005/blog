import { CvEditor } from "@/components/studio/cv-editor";
import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function StudioCvPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select("cv_md")
    .eq("id", 1)
    .maybeSingle();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">CV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Markdown source for the public CV page and PDF download.
        </p>
      </div>
      <CvEditor cvMd={data?.cv_md ?? ""} />
    </main>
  );
}
