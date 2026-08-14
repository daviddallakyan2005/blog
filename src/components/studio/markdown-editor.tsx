"use client";

import { useRef, useState } from "react";
import { Bold, Code, Heading2, Italic, Link2, SquareCode } from "lucide-react";

import { toast } from "sonner";

import { registerMediaAsset } from "@/lib/actions/media";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MarkdownEditorProps = {
  postId: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
  disabled?: boolean;
};

type WrapResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

function wrapSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix = prefix,
  placeholder = "text",
): WrapResult {
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  return {
    value: value.slice(0, start) + prefix + inner + suffix + value.slice(end),
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + inner.length,
  };
}

function prefixLine(value: string, start: number, prefix: string): WrapResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  return {
    value: value.slice(0, lineStart) + prefix + value.slice(lineStart),
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length,
  };
}

function fileExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) {
    return fromName;
  }
  const map: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[file.type] ?? "bin";
}

async function imageSize(
  file: File,
): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap !== "function") {
    return {};
  }
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

export function MarkdownEditor({
  postId,
  value,
  onChange,
  onSave,
  disabled,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function apply(result: WrapResult) {
    onChange(result.value);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) {
        return;
      }
      el.focus();
      el.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  function insertAtCursor(text: string) {
    const current = valueRef.current;
    const el = textareaRef.current;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    apply({
      value: current.slice(0, start) + text + current.slice(end),
      selectionStart: start + text.length,
      selectionEnd: start + text.length,
    });
  }

  function currentRange() {
    const el = textareaRef.current;
    return {
      start: el?.selectionStart ?? 0,
      end: el?.selectionEnd ?? 0,
    };
  }

  function bold() {
    const { start, end } = currentRange();
    apply(wrapSelection(value, start, end, "**"));
  }

  function italic() {
    const { start, end } = currentRange();
    apply(wrapSelection(value, start, end, "*"));
  }

  function inlineCode() {
    const { start, end } = currentRange();
    apply(wrapSelection(value, start, end, "`", "`", "code"));
  }

  function fencedCode() {
    const { start, end } = currentRange();
    apply(wrapSelection(value, start, end, "```\n", "\n```", "code"));
  }

  function heading() {
    const { start } = currentRange();
    apply(prefixLine(value, start, "## "));
  }

  function link() {
    const url = window.prompt("Link URL", "https://");
    if (!url) {
      return;
    }
    const { start, end } = currentRange();
    apply(wrapSelection(value, start, end, "[", `](${url})`, "link text"));
  }

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `posts/${postId}/${crypto.randomUUID()}.${fileExt(file)}`;
      const { error } = await supabase.storage
        .from("media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      const size = await imageSize(file);
      const registered = await registerMediaAsset({
        path,
        alt: file.name.replace(/\.[^.]+$/, ""),
        byte_size: file.size,
        ...size,
      });

      if (!registered.success) {
        toast.error(registered.error);
        return;
      }

      const { data } = supabase.storage.from("media").getPublicUrl(path);
      const alt = file.name.replace(/\.[^.]+$/, "") || "image";
      insertAtCursor(`![${alt}](${data.publicUrl})`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Image upload failed",
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const images = [...files].filter((file) => file.type.startsWith("image/"));
    for (const file of images) {
      await uploadImage(file);
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    const meta = event.metaKey || event.ctrlKey;
    if (!meta) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === "b") {
      event.preventDefault();
      bold();
    } else if (key === "i") {
      event.preventDefault();
      italic();
    } else if (key === "k") {
      event.preventDefault();
      link();
    } else if (key === "s") {
      event.preventDefault();
      event.stopPropagation();
      onSave?.();
    }
  }

  async function onPaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = [...event.clipboardData.files];
    if (files.some((file) => file.type.startsWith("image/"))) {
      event.preventDefault();
      await handleFiles(files);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        className="flex flex-wrap gap-1"
        role="toolbar"
        aria-label="Markdown"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Bold"
          aria-keyshortcuts="Control+B Meta+B"
          onClick={bold}
          disabled={disabled}
        >
          <Bold />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Italic"
          aria-keyshortcuts="Control+I Meta+I"
          onClick={italic}
          disabled={disabled}
        >
          <Italic />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Link"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={link}
          disabled={disabled}
        >
          <Link2 />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Inline code"
          onClick={inlineCode}
          disabled={disabled}
        >
          <Code />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Fenced code block"
          onClick={fencedCode}
          disabled={disabled}
        >
          <SquareCode />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Heading"
          onClick={heading}
          disabled={disabled}
        >
          <Heading2 />
        </Button>
      </div>
      <div
        className={cn(
          "relative min-h-0 flex-1",
          dragging && "ring-2 ring-ring/50",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={async (event) => {
          event.preventDefault();
          setDragging(false);
          await handleFiles(event.dataTransfer.files);
        }}
      >
        <Textarea
          ref={textareaRef}
          id="post-body"
          aria-label="Post body markdown"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          disabled={disabled || uploading}
          spellCheck
          className="min-h-[24rem] resize-y font-mono text-[13px] leading-relaxed md:min-h-[calc(100dvh-18rem)]"
        />
        {(dragging || uploading) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/80 text-sm text-muted-foreground">
            {uploading ? "Uploading image…" : "Drop image to upload"}
          </div>
        )}
      </div>
    </div>
  );
}
