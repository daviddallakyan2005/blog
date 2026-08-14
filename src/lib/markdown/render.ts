import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { getSingletonHighlighter } from "shiki";
import { unified } from "unified";

import { readingStats } from "./reading";
import { sanitizeSchema } from "./sanitize-schema";
import { extractToc, type TocItem } from "./toc";

export type RenderedMarkdown = {
  html: string;
  toc: TocItem[];
  readingMinutes: number;
  wordCount: number;
};

const HIGHLIGHT_LANGS = [
  "ts",
  "js",
  "tsx",
  "python",
  "bash",
  "json",
  "sql",
  "rust",
  "go",
  "yaml",
  "markdown",
  "plaintext",
] as const;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypePrettyCode, {
    theme: { light: "github-light", dark: "github-dark" },
    keepBackground: true,
    getHighlighter: (options) =>
      getSingletonHighlighter({
        ...options,
        themes: ["github-light", "github-dark"],
        langs: [...HIGHLIGHT_LANGS],
      }),
  })
  .use(rehypeKatex)
  .use(rehypeSanitize, sanitizeSchema)
  .use(rehypeStringify);

export async function renderMarkdown(md: string): Promise<RenderedMarkdown> {
  const file = await processor.process(md);
  const { minutes, words } = readingStats(md);

  return {
    html: String(file),
    toc: extractToc(md),
    readingMinutes: minutes,
    wordCount: words,
  };
}
