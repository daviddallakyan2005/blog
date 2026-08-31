import type { MetadataRoute } from "next";

import { getPublishedArticles } from "@/lib/data/posts";
import { getAllProjects } from "@/lib/data/projects";
import { SITE_URL, absoluteUrl, postPath } from "@/lib/seo/site";

const STATIC_PATHS = [
  "/",
  "/articles",
  "/projects",
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
  const [articles, projects] = await Promise.all([
    getPublishedArticles(500),
    projectSlugs(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => entry(path)),
    ...articles.map((post) => entry(postPath(post.slug), post.published_at)),
    ...projects.map((project) => entry(`/projects/${project.slug}`)),
  ];
}
