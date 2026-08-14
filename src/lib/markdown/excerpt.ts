const EXCERPT_MAX_CHARS = 160;

function stripFencedCode(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?(?:```|$)/g, " ")
    .replace(/~~~[\s\S]*?(?:~~~|$)/g, " ");
}

function toPlainText(markdown: string): string {
  return stripFencedCode(markdown)
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_~`]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function truncatePlainText(text: string, maxChars: number): string {
  if (text.length <= maxChars) {
    return text;
  }

  const slice = text.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const clipped = (
    lastSpace > 40 ? slice.slice(0, lastSpace) : slice
  ).trimEnd();
  return `${clipped}…`;
}

/** Plain-text excerpt; fenced code is dropped before truncating to ~160 chars. */
export function excerptFromMarkdown(
  markdown: string,
  maxChars = EXCERPT_MAX_CHARS,
): string {
  return truncatePlainText(toPlainText(markdown), maxChars);
}
