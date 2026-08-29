import type { MetadataRoute } from "next";

import { getPublishedArticles, getPublishedNotes } from "@/lib/data/posts";
import { getAllProjects } from "@/lib/data/projects";
import { getAllTags } from "@/lib/data/tags";
import { SITE_URL, absoluteUrl, postPath } from "@/lib/seo/site";

const STATIC_PATHS = [
  "/",
  "/articles",
  "/notes",
  "/tags",
  "/about",
  "/projects",
  "/search",
  "/contributions",
] as const;

async function projectSlugs(): Promise<{ slug: string }[]> {
  return (await getAllProjects()).map((project) => ({ slug: project.slug }));
}

function entry(
  path: string,
  lastModified?: string | Date | null,
): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? SITE_URL : absoluteUrl(path),
    lastModified: lastModified ? new Date(lastModified) : undefined,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, notes, tags, projects] = await Promise.all([
    getPublishedArticles(500),
    getPublishedNotes(500),
    getAllTags(),
    projectSlugs(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => entry(path)),
    ...articles.map((post) =>
      entry(postPath("article", post.slug), post.published_at),
    ),
    ...notes.map((post) =>
      entry(postPath("note", post.slug), post.published_at),
    ),
    ...tags.map((tag) => entry(`/tags/${tag.slug}`)),
    ...projects.map((project) => entry(`/projects/${project.slug}`)),
  ];
}
