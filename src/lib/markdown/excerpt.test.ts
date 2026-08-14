import { describe, expect, it } from "vitest";

import { excerptFromMarkdown } from "./excerpt";

describe("excerptFromMarkdown", () => {
  it("returns short plain text unchanged", () => {
    expect(excerptFromMarkdown("Hello **world**.")).toBe("Hello world.");
  });

  it("strips fenced code before excerpting", () => {
    const excerpt = excerptFromMarkdown(`Intro paragraph.

\`\`\`ts
const secret = "should not appear in the excerpt at all";
\`\`\`

More words.
`);

    expect(excerpt).toBe("Intro paragraph. More words.");
    expect(excerpt).not.toContain("secret");
    expect(excerpt).not.toContain("```");
  });

  it("truncates around 160 characters at a word boundary", () => {
    const words = Array.from({ length: 80 }, (_, i) => `word${i}`).join(" ");
    const excerpt = excerptFromMarkdown(words);

    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt.length).toBeLessThanOrEqual(161);
    expect(excerpt).not.toMatch(/word\d+$/);
  });

  it("returns an empty string for empty or code-only input", () => {
    expect(excerptFromMarkdown("")).toBe("");
    expect(excerptFromMarkdown("```\nonly code\n```")).toBe("");
  });
});
