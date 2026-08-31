"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useUnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import {
  archivePost,
  autosavePost,
  deletePost,
  previewMarkdown,
  publishPost,
  unpublishPost,
} from "@/lib/actions/posts";
import type { Tables } from "@/lib/database.types";
import { slugify } from "@/lib/slug";
import type { PostStatus } from "@/lib/validations/posts.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { AutosaveIndicator, type AutosaveStatus } from "./autosave-indicator";
import { MarkdownEditor } from "./markdown-editor";
import { MetadataSidebar, type EditorTag } from "./metadata-sidebar";
import { PreviewPane } from "./preview-pane";

type PostEditorProps = {
  post: Tables<"posts">;
  tags: EditorTag[];
};

type Draft = {
  title: string;
  slug: string;
  summary: string;
  bodyMd: string;
  tags: EditorTag[];
  coverPath: string;
  canonicalUrl: string;
};

function sameDraft(a: Draft, b: Draft) {
  return (
    a.title === b.title &&
    a.slug === b.slug &&
    a.summary === b.summary &&
    a.bodyMd === b.bodyMd &&
    a.coverPath === b.coverPath &&
    a.canonicalUrl === b.canonicalUrl &&
    a.tags.length === b.tags.length &&
    a.tags.every((tag, index) => tag.slug === b.tags[index]?.slug)
  );
}

export function PostEditor({ post, tags }: PostEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [summary, setSummary] = useState(post.summary ?? "");
  const [bodyMd, setBodyMd] = useState(post.body_md);
  const [editorTags, setEditorTags] = useState<EditorTag[]>(tags);
  const [coverPath, setCoverPath] = useState(post.cover_path ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(post.canonical_url ?? "");
  const [status, setStatus] = useState<PostStatus>(
    post.status === "published" || post.status === "archived"
      ? post.status
      : "draft",
  );
  const [previewHtml, setPreviewHtml] = useState(post.body_html);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("saved");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"editor" | "preview">("editor");

  const draftRef = useRef<Draft>({
    title,
    slug,
    summary,
    bodyMd,
    tags: editorTags,
    coverPath,
    canonicalUrl,
  });
  draftRef.current = {
    title,
    slug,
    summary,
    bodyMd,
    tags: editorTags,
    coverPath,
    canonicalUrl,
  };

  const savedRef = useRef<Draft>(draftRef.current);
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useUnsavedChangesWarning(dirty);

  const markDirty = useCallback(() => {
    setDirty(true);
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return false;
    }

    const snapshot = { ...draftRef.current };
    const nextSlug =
      snapshot.slug.trim() === ""
        ? slugify(snapshot.title) || "post"
        : snapshot.slug;
    if (nextSlug !== snapshot.slug) {
      setSlug(nextSlug);
      snapshot.slug = nextSlug;
      draftRef.current = { ...draftRef.current, slug: nextSlug };
    }

    savingRef.current = true;
    setAutosaveStatus("saving");

    const result = await autosavePost({
      id: post.id,
      title: snapshot.title,
      slug: nextSlug,
      summary: snapshot.summary,
      body_md: snapshot.bodyMd,
      tagSlugs: snapshot.tags.map((tag) => tag.slug),
      cover_path: snapshot.coverPath,
      canonical_url: snapshot.canonicalUrl,
    });

    savingRef.current = false;

    if (!result.success) {
      pendingSaveRef.current = false;
      setAutosaveStatus("error");
      toast.error(result.error);
      return false;
    }

    savedRef.current = { ...snapshot, slug: nextSlug };
    const stillDirty = !sameDraft(draftRef.current, savedRef.current);
    const queued = pendingSaveRef.current;
    pendingSaveRef.current = false;
    setDirty(stillDirty);
    setAutosaveStatus(stillDirty ? "idle" : "saved");

    if (queued && stillDirty) {
      return save();
    }

    return true;
  }, [post.id]);

  useEffect(() => {
    if (!dirty) {
      return;
    }
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }
    saveTimer.current = setTimeout(() => {
      void save();
    }, 800);
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }
    };
  }, [
    dirty,
    title,
    slug,
    summary,
    bodyMd,
    editorTags,
    coverPath,
    canonicalUrl,
    save,
  ]);

  useEffect(() => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }
    previewTimer.current = setTimeout(() => {
      void previewMarkdown(bodyMd)
        .then((rendered) => setPreviewHtml(rendered.html))
        .catch((error: unknown) => {
          toast.error(
            error instanceof Error ? error.message : "Preview failed",
          );
        });
    }, 400);
    return () => {
      if (previewTimer.current) {
        clearTimeout(previewTimer.current);
      }
    };
  }, [bodyMd]);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void save();
    }
  }

  async function runStatusAction(
    action: (id: string) => Promise<{ success: boolean; error?: string }>,
    nextStatus: PostStatus,
    successMessage: string,
  ) {
    setBusy(true);
    const saved = dirty ? await save() : true;
    if (!saved) {
      setBusy(false);
      return;
    }
    const result = await action(post.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error ?? "Action failed");
      return;
    }
    setStatus(nextStatus);
    toast.success(successMessage);
    router.refresh();
  }

  async function onDelete() {
    setBusy(true);
    const result = await deletePost(post.id);
    setBusy(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDirty(false);
    toast.success("Post deleted");
    router.push("/studio/posts");
  }

  return (
    <div className="flex flex-col gap-6 xl:flex-row" onKeyDown={onKeyDown}>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div className="grid min-w-0 flex-1 gap-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                markDirty();
              }}
              autoComplete="off"
            />
          </div>
          <AutosaveIndicator
            status={autosaveStatus}
            className="shrink-0 pb-2"
          />
        </div>

        <div
          className="flex gap-2 md:hidden"
          role="tablist"
          aria-label="Editor view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "editor"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === "editor"
                ? "bg-muted font-medium"
                : "text-muted-foreground",
            )}
            onClick={() => setTab("editor")}
          >
            Editor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === "preview"
                ? "bg-muted font-medium"
                : "text-muted-foreground",
            )}
            onClick={() => setTab("preview")}
          >
            Preview
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className={cn(tab !== "editor" && "hidden md:flex", "min-h-0")}>
            <MarkdownEditor
              postId={post.id}
              value={bodyMd}
              onChange={(next) => {
                setBodyMd(next);
                markDirty();
              }}
              onSave={() => {
                void save();
              }}
            />
          </div>
          <div
            className={cn(
              tab !== "preview" && "hidden md:block",
              "min-h-[24rem] rounded-md border border-border bg-card p-4 md:min-h-[calc(100dvh-18rem)]",
            )}
          >
            <PreviewPane html={previewHtml} />
          </div>
        </div>
      </div>

      <div className="xl:w-80 xl:shrink-0">
        <MetadataSidebar
          slug={slug}
          summary={summary}
          tags={editorTags}
          coverPath={coverPath}
          canonicalUrl={canonicalUrl}
          status={status}
          busy={busy}
          onSlugChange={(value) => {
            setSlug(value);
            markDirty();
          }}
          onSummaryChange={(value) => {
            setSummary(value);
            markDirty();
          }}
          onTagsChange={(next) => {
            setEditorTags(next);
            markDirty();
          }}
          onCoverPathChange={(value) => {
            setCoverPath(value);
            markDirty();
          }}
          onCanonicalUrlChange={(value) => {
            setCanonicalUrl(value);
            markDirty();
          }}
          onPublish={() => {
            void runStatusAction(publishPost, "published", "Published");
          }}
          onUnpublish={() => {
            void runStatusAction(unpublishPost, "draft", "Unpublished");
          }}
          onArchive={() => {
            void runStatusAction(archivePost, "archived", "Archived");
          }}
          onDelete={() => {
            void onDelete();
          }}
        />
      </div>
    </div>
  );
}
