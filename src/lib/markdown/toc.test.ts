import { describe, expect, it } from "vitest";

import { extractToc } from "./toc";

describe("extractToc", () => {
  it("extracts ATX headings with github-slugger ids", () => {
    const toc = extractToc(`# Title

## Hello World

### Nested section
`);

    expect(toc).toEqual([
      { id: "title", text: "Title", level: 1 },
      { id: "hello-world", text: "Hello World", level: 2 },
      { id: "nested-section", text: "Nested section", level: 3 },
    ]);
  });

  it("dedupes duplicate headings the way github-slugger does", () => {
    const toc = extractToc(`## Intro

## Intro
`);

    expect(toc.map((item) => item.id)).toEqual(["intro", "intro-1"]);
  });

  it("ignores headings inside fenced code", () => {
    const toc = extractToc(`## Real

\`\`\`md
# Fake heading
\`\`\`
`);

    expect(toc).toEqual([{ id: "real", text: "Real", level: 2 }]);
  });

  it("uses plain text from inline markup", () => {
    const toc = extractToc("## Hello **World** and `code`");

    expect(toc).toEqual([
      { id: "hello-world-and-code", text: "Hello World and code", level: 2 },
    ]);
  });
});
