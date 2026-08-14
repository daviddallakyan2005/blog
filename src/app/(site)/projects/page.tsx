import type { Metadata } from "next";

import { ProjectCard } from "@/components/site/project-card";
import { getAllProjects } from "@/lib/data/projects";

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected work and open-source projects.",
};

export default async function ProjectsPage() {
  const projects = await getAllProjects();
  const featured = projects.filter((project) => project.featured);
  const rest = projects.filter((project) => !project.featured);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-3 text-muted-foreground">
        Selected work and open-source projects.
      </p>

      {projects.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="mt-10 space-y-12">
          {featured.length > 0 ? (
            <section aria-labelledby="featured-projects-heading">
              <h2
                id="featured-projects-heading"
                className="text-xl font-semibold tracking-tight"
              >
                Featured
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {featured.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}

          {rest.length > 0 ? (
            <section aria-labelledby="all-projects-heading">
              {featured.length > 0 ? (
                <h2
                  id="all-projects-heading"
                  className="text-xl font-semibold tracking-tight"
                >
                  More
                </h2>
              ) : (
                <h2 id="all-projects-heading" className="sr-only">
                  All projects
                </h2>
              )}
              <div
                className={
                  featured.length > 0
                    ? "mt-6 grid gap-4 sm:grid-cols-2"
                    : "grid gap-4 sm:grid-cols-2"
                }
              >
                {rest.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
