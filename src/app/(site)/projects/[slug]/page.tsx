import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RenderedHtml } from "@/components/prose/rendered-html";
import { Badge } from "@/components/ui/badge";
import { getAllProjects, getProjectBySlug } from "@/lib/data/projects";
import { SITE_NAME } from "@/lib/seo/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const projects = await getAllProjects();
  return projects.length > 0
    ? projects.map((project) => ({ slug: project.slug }))
    : [{ slug: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return { title: "Project" };
  }

  const description = project.tagline ?? undefined;

  return {
    title: project.name,
    description,
    openGraph: {
      type: "website",
      title: project.name,
      description,
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary",
      title: project.name,
      description,
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <p className="text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground">
          Projects
        </Link>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {project.name}
      </h1>
      {project.tagline ? (
        <p className="mt-3 text-lg text-muted-foreground">{project.tagline}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.primary_language ? (
          <Badge variant="secondary">{project.primary_language}</Badge>
        ) : null}
        {project.role ? <Badge variant="outline">{project.role}</Badge> : null}
        {project.tech.map((item) => (
          <Badge key={item} variant="outline">
            {item}
          </Badge>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        {project.repo_url ? (
          <a
            href={project.repo_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            Repository
          </a>
        ) : null}
        {project.homepage_url ? (
          <a
            href={project.homepage_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            Homepage
          </a>
        ) : null}
      </div>

      {project.description_html.trim() ? (
        <div className="mt-10">
          <RenderedHtml html={project.description_html} />
        </div>
      ) : null}
    </div>
  );
}
