import { RenderedHtml } from "@/components/prose/rendered-html";
import { cn } from "@/lib/utils";

type PreviewPaneProps = {
  html: string;
  className?: string;
};

export function PreviewPane({ html, className }: PreviewPaneProps) {
  return (
    <div
      role="region"
      aria-label="Markdown preview"
      className={cn("overflow-auto", className)}
    >
      <RenderedHtml html={html} />
    </div>
  );
}
