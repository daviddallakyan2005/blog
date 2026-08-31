import { CopyCodeRoot } from "@/components/prose/copy-code-root";

export function RenderedHtml({ html }: { html: string }) {
  return (
    <CopyCodeRoot key={html}>
      <article
        className="prose-blog"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </CopyCodeRoot>
  );
}
