"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateCv } from "@/lib/actions/cv";
import { previewMarkdown } from "@/lib/actions/posts";
import { PreviewPane } from "@/components/studio/preview-pane";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CvEditor({ cvMd }: { cvMd: string }) {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(cvMd);
  const [previewHtml, setPreviewHtml] = useState("");
  const [pending, setPending] = useState(false);
  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (previewTimer.current) {
      clearTimeout(previewTimer.current);
    }
    previewTimer.current = setTimeout(() => {
      void previewMarkdown(markdown)
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
  }, [markdown]);

  async function onSave() {
    if (pending) {
      return;
    }
    setPending(true);
    const result = await updateCv({ cv_md: markdown });
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("CV saved");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="cv-markdown">CV (markdown)</Label>
          <Textarea
            id="cv-markdown"
            value={markdown}
            onChange={(event) => setMarkdown(event.target.value)}
            className="min-h-[24rem] font-mono text-[13px] md:min-h-[calc(100dvh-18rem)]"
          />
        </div>
        <div className="min-h-[24rem] rounded-md border border-border bg-card p-4 md:min-h-[calc(100dvh-18rem)]">
          <PreviewPane html={previewHtml} />
        </div>
      </div>
      <Button
        type="button"
        onClick={onSave}
        disabled={pending}
        aria-busy={pending}
      >
        {pending ? "Saving…" : "Save CV"}
      </Button>
    </div>
  );
}
