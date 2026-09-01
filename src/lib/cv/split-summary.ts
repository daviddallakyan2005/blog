const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

type Block = {
  start: number;
  end: number;
  tag: string;
};

function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function indexOfIgnoreCase(
  html: string,
  pattern: RegExp,
  from: number,
): number {
  const match = html.slice(from).match(pattern);
  if (!match || match.index === undefined) {
    return -1;
  }
  return from + match.index;
}

function indexOfTagOpen(html: string, tag: string, from: number): number {
  return indexOfIgnoreCase(html, new RegExp(`<${tag}(?=[\\s>/])`, "i"), from);
}

function indexOfCloseTag(html: string, tag: string, from: number): number {
  return indexOfIgnoreCase(html, new RegExp(`</${tag}>`, "i"), from);
}

function elementEnd(html: string, start: number, tag: string): number {
  const gt = html.indexOf(">", start);
  if (gt === -1) {
    return html.length;
  }

  const openTag = html.slice(start, gt + 1);
  if (openTag.endsWith("/>") || VOID_TAGS.has(tag)) {
    return gt + 1;
  }

  const closeNeedle = `</${tag}>`;
  let depth = 1;
  let i = gt + 1;

  while (i < html.length && depth > 0) {
    const nextOpen = indexOfTagOpen(html, tag, i);
    const nextClose = indexOfCloseTag(html, tag, i);
    if (nextClose === -1) {
      return html.length;
    }
    if (nextOpen !== -1 && nextOpen < nextClose) {
      const openGt = html.indexOf(">", nextOpen);
      if (openGt === -1) {
        return html.length;
      }
      const fragment = html.slice(nextOpen, openGt + 1);
      if (!fragment.endsWith("/>")) {
        depth += 1;
      }
      i = openGt + 1;
    } else {
      depth -= 1;
      i = nextClose + closeNeedle.length;
    }
  }

  return i;
}

function nextBlock(html: string, from: number): Block | null {
  const start = html.indexOf("<", from);
  if (start === -1) {
    return null;
  }

  const tagMatch = html.slice(start).match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
  if (!tagMatch) {
    return nextBlock(html, start + 1);
  }

  const tag = tagMatch[1].toLowerCase();
  const end = elementEnd(html, start, tag);
  return { start, end, tag };
}

function splitTopLevel(html: string): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < html.length) {
    const block = nextBlock(html, i);
    if (!block) {
      break;
    }
    blocks.push(block);
    i = block.end;
  }
  return blocks;
}

export type CvExperienceBasic = {
  org: string;
  metaHtml: string;
};

function innerHtml(html: string, block: Block): string {
  const openEnd = html.indexOf(">", block.start);
  if (openEnd === -1 || openEnd >= block.end) {
    return "";
  }
  const closeStart = html.lastIndexOf("</", block.end);
  if (closeStart <= openEnd) {
    return "";
  }
  return html.slice(openEnd + 1, closeStart);
}

function headingLabel(html: string, block: Block): string {
  return visibleText(html.slice(block.start, block.end)).toLowerCase();
}

function sectionAfterHeading(
  blocks: Block[],
  headingIndex: number,
): Block[] {
  let sectionEnd = headingIndex + 1;
  while (
    sectionEnd < blocks.length &&
    blocks[sectionEnd].tag !== "h1" &&
    blocks[sectionEnd].tag !== "h2"
  ) {
    sectionEnd += 1;
  }
  return blocks.slice(headingIndex + 1, sectionEnd);
}

export function extractCvExperienceBasics(
  html: string,
): CvExperienceBasic[] {
  if (html.trim() === "") {
    return [];
  }

  const blocks = splitTopLevel(html);
  const experienceIndex = blocks.findIndex(
    (block) => block.tag === "h2" && headingLabel(html, block) === "experience",
  );

  if (experienceIndex === -1) {
    return [];
  }

  const section = sectionAfterHeading(blocks, experienceIndex);
  const jobs: CvExperienceBasic[] = [];

  for (let i = 0; i < section.length; i++) {
    const block = section[i];
    if (block.tag !== "h3") {
      continue;
    }

    const org = visibleText(html.slice(block.start, block.end));
    let metaHtml = "";
    for (let j = i + 1; j < section.length; j++) {
      if (section[j].tag === "h3") {
        break;
      }
      if (section[j].tag === "p") {
        metaHtml = innerHtml(html, section[j]);
        break;
      }
    }
    jobs.push({ org, metaHtml });
  }

  return jobs;
}

export function splitCvSummary(html: string): {
  summaryHtml: string;
  restHtml: string;
} {
  if (html.trim() === "") {
    return { summaryHtml: "", restHtml: "" };
  }

  const blocks = splitTopLevel(html);
  const summaryIndex = blocks.findIndex((block) => {
    if (block.tag !== "h2") {
      return false;
    }
    const heading = html.slice(block.start, block.end);
    return visibleText(heading).toLowerCase() === "summary";
  });

  if (summaryIndex === -1) {
    return { summaryHtml: "", restHtml: html };
  }

  let sectionEnd = summaryIndex + 1;
  while (
    sectionEnd < blocks.length &&
    blocks[sectionEnd].tag !== "h1" &&
    blocks[sectionEnd].tag !== "h2"
  ) {
    sectionEnd += 1;
  }

  const summaryBlocks = blocks.slice(summaryIndex + 1, sectionEnd);
  const summaryHtml =
    summaryBlocks.length === 0
      ? ""
      : html.slice(
          summaryBlocks[0].start,
          summaryBlocks[summaryBlocks.length - 1].end,
        );

  const before = html.slice(0, blocks[summaryIndex].start);
  const after =
    sectionEnd < blocks.length ? html.slice(blocks[sectionEnd].start) : "";

  return {
    summaryHtml: summaryHtml.trim(),
    restHtml: `${before}${after}`.trim(),
  };
}
