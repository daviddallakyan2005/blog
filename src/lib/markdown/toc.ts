import GithubSlugger from "github-slugger";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type TocItem = {
  id: string;
  text: string;
  level: number;
};

type MdNode = {
  type: string;
  depth?: number;
  value?: string;
  alt?: string;
  children?: MdNode[];
};

function textContent(node: MdNode): string {
  if (typeof node.value === "string") {
    return node.value;
  }

  if (typeof node.alt === "string" && !node.children?.length) {
    return node.alt;
  }

  return node.children?.map(textContent).join("") ?? "";
}

function collectHeadings(node: MdNode, slugger: GithubSlugger): TocItem[] {
  if (node.type === "heading" && node.depth) {
    const text = textContent(node).trim();
    return [{ id: slugger.slug(text), text, level: node.depth }];
  }

  return (
    node.children?.flatMap((child) => collectHeadings(child, slugger)) ?? []
  );
}

/** Heading ids use github-slugger so they match rehype-slug. */
export function extractToc(markdown: string): TocItem[] {
  const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown);
  return collectHeadings(tree as MdNode, new GithubSlugger());
}
