import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import remarkParse from "remark-parse";
import { unified } from "unified";

import { CvDocument } from "./cv-document";

type PdfElement = Parameters<typeof renderToBuffer>[0];

export type CvText = { type: "text"; value: string };
export type CvStrong = { type: "strong"; children: CvInline[] };
export type CvEmphasis = { type: "emphasis"; children: CvInline[] };
export type CvLink = { type: "link"; href: string; children: CvInline[] };
export type CvInline = CvText | CvStrong | CvEmphasis | CvLink;

export type CvHeading = {
  type: "heading";
  level: 1 | 2 | 3;
  children: CvInline[];
};
export type CvParagraph = { type: "paragraph"; children: CvInline[] };
export type CvListItem = { children: CvInline[] };
export type CvList = { type: "list"; items: CvListItem[] };
export type CvBlock = CvHeading | CvParagraph | CvList;

type MdNode = {
  type: string;
  depth?: number;
  value?: string;
  url?: string;
  ordered?: boolean;
  children?: MdNode[];
};

function isAllowedHref(href: string): boolean {
  const trimmed = href.trim();
  const colon = trimmed.indexOf(":");
  if (colon === -1) {
    return false;
  }
  const protocol = trimmed.slice(0, colon).toLowerCase();
  return protocol === "http" || protocol === "https" || protocol === "mailto";
}

function inlineNodes(nodes: MdNode[] | undefined): CvInline[] {
  if (!nodes) {
    return [];
  }

  const result: CvInline[] = [];
  for (const node of nodes) {
    if (node.type === "text" && typeof node.value === "string") {
      result.push({ type: "text", value: node.value });
    } else if (node.type === "strong") {
      result.push({ type: "strong", children: inlineNodes(node.children) });
    } else if (node.type === "emphasis") {
      result.push({ type: "emphasis", children: inlineNodes(node.children) });
    } else if (node.type === "link" && typeof node.url === "string") {
      const children = inlineNodes(node.children);
      if (isAllowedHref(node.url)) {
        result.push({
          type: "link",
          href: node.url,
          children,
        });
      } else {
        result.push(...children);
      }
    } else if (node.children) {
      result.push(...inlineNodes(node.children));
    } else if (typeof node.value === "string") {
      result.push({ type: "text", value: node.value });
    }
  }
  return result;
}

function headingLevel(depth: number | undefined): 1 | 2 | 3 | null {
  if (depth === 1 || depth === 2 || depth === 3) {
    return depth;
  }
  if (typeof depth === "number" && depth >= 4) {
    return 3;
  }
  return null;
}

function listItemInlines(item: MdNode): CvInline[] {
  const result: CvInline[] = [];
  for (const child of item.children ?? []) {
    if (child.type === "paragraph") {
      result.push(...inlineNodes(child.children));
    } else {
      result.push(...inlineNodes([child]));
    }
  }
  return result;
}

export function parseCvMarkdown(md: string): CvBlock[] {
  const tree = unified().use(remarkParse).parse(md) as MdNode;
  const blocks: CvBlock[] = [];

  for (const node of tree.children ?? []) {
    if (node.type === "heading") {
      const level = headingLevel(node.depth);
      if (level) {
        blocks.push({
          type: "heading",
          level,
          children: inlineNodes(node.children),
        });
      }
    } else if (node.type === "paragraph") {
      blocks.push({
        type: "paragraph",
        children: inlineNodes(node.children),
      });
    } else if (node.type === "list" && node.ordered !== true) {
      blocks.push({
        type: "list",
        items: (node.children ?? []).map((item) => ({
          children: listItemInlines(item),
        })),
      });
    }
  }

  return blocks;
}

export async function renderCvPdf(md: string): Promise<Buffer> {
  const blocks = parseCvMarkdown(md);
  return renderToBuffer(createElement(CvDocument, { blocks }) as PdfElement);
}
