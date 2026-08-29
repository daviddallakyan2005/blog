import { cacheLife, cacheTag } from "next/cache";

import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/anon";

import type { SiteSettings, SiteSocial } from "./types";

export function parseSocial(value: Json | null | undefined): SiteSocial {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const pick = (key: keyof SiteSocial) => {
    const raw = record[key];
    return typeof raw === "string" && raw.trim() !== ""
      ? raw.trim()
      : undefined;
  };

  return {
    github: pick("github"),
    twitter: pick("twitter"),
    linkedin: pick("linkedin"),
    email: pick("email"),
  };
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select(
        "display_name, tagline, bio_md, bio_html, cv_md, cv_html, seo_title, seo_description, avatar_path, social",
      )
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      display_name: data.display_name,
      tagline: data.tagline,
      bio_md: data.bio_md,
      bio_html: data.bio_html,
      cv_md: data.cv_md,
      cv_html: data.cv_html,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      avatar_path: data.avatar_path,
      social: parseSocial(data.social),
    };
  } catch {
    return null;
  }
}
