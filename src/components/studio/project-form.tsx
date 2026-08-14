"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { deleteProject, updateProject } from "@/lib/actions/projects";
import type { Tables } from "@/lib/database.types";
import type { ProjectStatus } from "@/lib/validations/projects.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

export function ProjectForm({ project }: { project: Tables<"projects"> }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [tagline, setTagline] = useState(project.tagline ?? "");
  const [descriptionMd, setDescriptionMd] = useState(project.description_md);
  const [repoUrl, setRepoUrl] = useState(project.repo_url ?? "");
  const [homepageUrl, setHomepageUrl] = useState(project.homepage_url ?? "");
  const [primaryLanguage, setPrimaryLanguage] = useState(
    project.primary_language ?? "",
  );
  const [tech, setTech] = useState(project.tech.join(", "));
  const [role, setRole] = useState(project.role ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project.status === "paused" || project.status === "archived"
      ? project.status
      : "active",
  );
  const [featured, setFeatured] = useState(project.featured);
  const [sortOrder, setSortOrder] = useState(String(project.sort_order));
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await updateProject({
      id: project.id,
      name,
      slug,
      tagline,
      description_md: descriptionMd,
      repo_url: repoUrl,
      homepage_url: homepageUrl,
      primary_language: primaryLanguage,
      tech: tech
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      role,
      status,
      featured,
      sort_order: Number.parseInt(sortOrder, 10) || 0,
    });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Project saved");
    router.refresh();
  }

  async function onDelete() {
    if (!window.confirm(`Delete “${project.name}”?`)) {
      return;
    }
    setPending(true);
    const result = await deleteProject(project.id);
    if (!result.success) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    router.push("/studio/projects");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      <div className="grid gap-2">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-slug">Slug</Label>
        <Input
          id="project-slug"
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-tagline">Tagline</Label>
        <Input
          id="project-tagline"
          value={tagline}
          onChange={(event) => setTagline(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-description">Description (markdown)</Label>
        <Textarea
          id="project-description"
          value={descriptionMd}
          onChange={(event) => setDescriptionMd(event.target.value)}
          className="min-h-40 font-mono text-[13px]"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="project-repo">Repo URL</Label>
          <Input
            id="project-repo"
            type="url"
            value={repoUrl}
            onChange={(event) => setRepoUrl(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project-homepage">Homepage URL</Label>
          <Input
            id="project-homepage"
            type="url"
            value={homepageUrl}
            onChange={(event) => setHomepageUrl(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="project-language">Primary language</Label>
          <Input
            id="project-language"
            value={primaryLanguage}
            onChange={(event) => setPrimaryLanguage(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project-role">Role</Label>
          <Input
            id="project-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="project-tech">Tech (comma-separated)</Label>
        <Input
          id="project-tech"
          value={tech}
          onChange={(event) => setTech(event.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="project-status">Status</Label>
          <select
            id="project-status"
            aria-label="Status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ProjectStatus)
            }
            className={selectClassName}
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project-sort">Sort order</Label>
          <Input
            id="project-sort"
            type="number"
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={featured}
            onChange={(event) => setFeatured(event.target.checked)}
          />
          Featured
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={pending}
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </form>
  );
}
