import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import type { Project } from "./types";

export type { Project } from "./types";

const PROJECT_COLUMNS =
  "id, slug, name, tagline, description_html, repo_url, homepage_url, primary_language, tech, role, status, featured, sort_order, stars, forks";

function mapProject(row: {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description_html: string;
  repo_url: string | null;
  homepage_url: string | null;
  primary_language: string | null;
  tech: string[] | null;
  role: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
  stars: number | null;
  forks: number | null;
}): Project {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description_html: row.description_html,
    repo_url: row.repo_url,
    homepage_url: row.homepage_url,
    primary_language: row.primary_language,
    tech: row.tech ?? [],
    role: row.role,
    status: row.status,
    featured: row.featured,
    sort_order: row.sort_order,
    stars: row.stars,
    forks: row.forks,
  };
}

export async function getFeaturedProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("featured", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(mapProject);
  } catch {
    return [];
  }
}

export async function getAllProjects(): Promise<Project[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(mapProject);
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  "use cache";
  cacheTag("projects", `project:${slug}`);
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select(PROJECT_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapProject(data);
  } catch {
    return null;
  }
}
