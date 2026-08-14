import { SettingsForm } from "@/components/studio/settings-form";
import { requireOwner } from "@/lib/auth";
import { parseSocial } from "@/lib/data/settings";
import { createClient } from "@/lib/supabase/server";

export default async function StudioSettingsPage() {
  await requireOwner();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_settings")
    .select(
      "display_name, tagline, bio_md, seo_title, seo_description, social",
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Site identity, about bio, social links, and SEO defaults.
        </p>
      </div>
      <SettingsForm
        settings={{
          display_name: data?.display_name ?? null,
          tagline: data?.tagline ?? null,
          bio_md: data?.bio_md ?? null,
          seo_title: data?.seo_title ?? null,
          seo_description: data?.seo_description ?? null,
          social: parseSocial(data?.social),
        }}
      />
    </main>
  );
}
