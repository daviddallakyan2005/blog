import { cn } from "@/lib/utils";

import "./preview.css";

type PreviewPaneProps = {
  html: string;
  className?: string;
};

export function PreviewPane({ html, className }: PreviewPaneProps) {
  return (
    <article
      aria-label="Markdown preview"
      className={cn("prose-blog overflow-auto", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
