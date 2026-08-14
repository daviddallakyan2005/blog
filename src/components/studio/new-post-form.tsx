"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createPost } from "@/lib/actions/posts";
import type { PostKind } from "@/lib/validations/posts.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewPostForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PostKind>("article");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = await createPost({ title, kind });
    if (!result.success) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    router.push(`/studio/posts/${result.id}/edit`);
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <div className="grid gap-2">
        <Label htmlFor="new-post-title">Title</Label>
        <Input
          id="new-post-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          autoFocus
          autoComplete="off"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-post-kind">Kind</Label>
        <select
          id="new-post-kind"
          aria-label="Kind"
          value={kind}
          onChange={(event) => setKind(event.target.value as PostKind)}
          className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <option value="article">Article</option>
          <option value="note">Note</option>
        </select>
      </div>
      <Button type="submit" disabled={pending || title.trim() === ""}>
        {pending ? "Creating…" : "Create draft"}
      </Button>
    </form>
  );
}
