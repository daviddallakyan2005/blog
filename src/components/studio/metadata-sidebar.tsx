"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { slugify } from "@/lib/slug";
import type { PostKind, PostStatus } from "@/lib/validations/posts.schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export type EditorTag = {
  slug: string;
  name: string;
};

type MetadataSidebarProps = {
  slug: string;
  summary: string;
  kind: PostKind;
  tags: EditorTag[];
  coverPath: string;
  canonicalUrl: string;
  status: PostStatus;
  busy?: boolean;
  onSlugChange: (value: string) => void;
  onSummaryChange: (value: string) => void;
  onKindChange: (value: PostKind) => void;
  onTagsChange: (tags: EditorTag[]) => void;
  onCoverPathChange: (value: string) => void;
  onCanonicalUrlChange: (value: string) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

const STATUS_LABEL: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export function MetadataSidebar({
  slug,
  summary,
  kind,
  tags,
  coverPath,
  canonicalUrl,
  status,
  busy,
  onSlugChange,
  onSummaryChange,
  onKindChange,
  onTagsChange,
  onCoverPathChange,
  onCanonicalUrlChange,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
}: MetadataSidebarProps) {
  const [tagDraft, setTagDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  function addTag(raw: string) {
    const name = raw.trim().replace(/,$/, "");
    const nextSlug = slugify(name);
    if (!nextSlug || tags.some((tag) => tag.slug === nextSlug)) {
      setTagDraft("");
      return;
    }
    onTagsChange([...tags, { slug: nextSlug, name }]);
    setTagDraft("");
  }

  function onTagKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(tagDraft);
    } else if (event.key === "Backspace" && tagDraft === "" && tags.length) {
      onTagsChange(tags.slice(0, -1));
    }
  }

  return (
    <aside className="flex flex-col gap-4" aria-label="Post metadata">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Status</p>
        <Badge
          variant={
            status === "published"
              ? "default"
              : status === "archived"
                ? "outline"
                : "secondary"
          }
        >
          {STATUS_LABEL[status]}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        {status !== "published" ? (
          <Button type="button" onClick={onPublish} disabled={busy}>
            Publish
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onUnpublish}
            disabled={busy}
          >
            Unpublish
          </Button>
        )}
        {status === "archived" ? (
          <Button
            type="button"
            variant="outline"
            onClick={onUnpublish}
            disabled={busy}
          >
            Restore to draft
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onArchive}
            disabled={busy}
          >
            Archive
          </Button>
        )}
      </div>

      <Separator />

      <div className="grid gap-2">
        <Label htmlFor="post-slug">Slug</Label>
        <Input
          id="post-slug"
          value={slug}
          onChange={(event) => onSlugChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post-kind">Kind</Label>
        <select
          id="post-kind"
          aria-label="Kind"
          value={kind}
          onChange={(event) => onKindChange(event.target.value as PostKind)}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="article">Article</option>
          <option value="note">Note</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post-summary">Summary</Label>
        <Textarea
          id="post-summary"
          value={summary}
          onChange={(event) => onSummaryChange(event.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post-tags">Tags</Label>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag.slug} variant="secondary" className="gap-1 pr-1">
              {tag.name}
              <button
                type="button"
                aria-label={`Remove tag ${tag.name}`}
                className="rounded-sm p-0.5 hover:bg-muted"
                onClick={() =>
                  onTagsChange(tags.filter((item) => item.slug !== tag.slug))
                }
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          id="post-tags"
          value={tagDraft}
          onChange={(event) => setTagDraft(event.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={() => {
            if (tagDraft.trim()) {
              addTag(tagDraft);
            }
          }}
          placeholder="Add tag and press Enter"
          autoComplete="off"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post-cover">Cover path or URL</Label>
        <Input
          id="post-cover"
          value={coverPath}
          onChange={(event) => onCoverPathChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="post-canonical">Canonical URL</Label>
        <Input
          id="post-canonical"
          type="url"
          value={canonicalUrl}
          onChange={(event) => onCanonicalUrlChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      <Separator />

      <Button
        type="button"
        variant="destructive"
        onClick={() => setConfirmDelete(true)}
        disabled={busy}
      >
        Delete post
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this post?</DialogTitle>
            <DialogDescription>
              This removes the post and its revisions. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
