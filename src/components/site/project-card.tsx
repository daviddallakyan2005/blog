import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/data/types";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          <Link href={`/projects/${project.slug}`} className="hover:text-accent">
            {project.name}
          </Link>
        </CardTitle>
        {project.tagline ? (
          <CardDescription>{project.tagline}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {project.primary_language ? (
            <Badge variant="secondary">{project.primary_language}</Badge>
          ) : null}
          {project.tech.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
        {project.homepage_url || project.repo_url ? (
          <div className="flex flex-wrap gap-3">
            {project.homepage_url ? (
              <a
                href={project.homepage_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                Website
              </a>
            ) : null}
            {project.repo_url ? (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                Repository
              </a>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
