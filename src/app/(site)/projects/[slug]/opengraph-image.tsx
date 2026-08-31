import {
  createOgImage,
  ogContentType,
  ogSize,
} from "@/components/seo/og-image";
import { getAllProjects, getProjectBySlug } from "@/lib/data/projects";
import { SITE_NAME } from "@/lib/seo/site";

export const alt = SITE_NAME;
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.length > 0
    ? projects.map((project) => ({ slug: project.slug }))
    : [{ slug: "_" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  return createOgImage({
    title: project?.name ?? "Project",
  });
}
