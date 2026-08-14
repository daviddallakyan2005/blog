import { describe, expect, it } from "vitest";

import { renderMarkdown } from "./render";

describe("renderMarkdown", () => {
  it("renders GFM tables", async () => {
    const { html } = await renderMarkdown(`| A | B |
| --- | --- |
| 1 | 2 |
`);

    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("<td>");
    expect(html).toContain("1");
    expect(html).toContain("2");
  }, 30_000);

  it("highlights fenced code and keeps data-language", async () => {
    const { html } = await renderMarkdown("```ts\nconst x = 1;\n```\n");

    expect(html).toContain("<pre");
    expect(html).toContain("<code");
    expect(html).toContain('data-language="ts"');
    expect(html).toContain("const");
  }, 30_000);

  it("renders inline and display math", async () => {
    const inline = await renderMarkdown("The value is $x$.");
    expect(inline.html).toContain("katex");
    expect(inline.html).not.toContain("$x$");

    const display = await renderMarkdown("$$a^2 + b^2 = c^2$$");
    expect(display.html).toContain("katex");
  }, 30_000);

  it("adds autolinked heading ids that match the TOC slugger", async () => {
    const { html, toc } = await renderMarkdown("## Hello World\n\nText.\n");

    expect(toc).toEqual([{ id: "hello-world", text: "Hello World", level: 2 }]);
    expect(html).toContain('id="hello-world"');
    expect(html).toContain('href="#hello-world"');
  }, 30_000);

  it("strips script tags", async () => {
    const { html } = await renderMarkdown(
      'Hello <script>alert("xss")</script> world',
    );

    expect(html.toLowerCase()).not.toContain("<script");
    expect(html.toLowerCase()).not.toContain("</script");
  }, 30_000);

  it("strips javascript: urls", async () => {
    const { html } = await renderMarkdown("[click](javascript:alert(1))");

    expect(html.toLowerCase()).not.toContain("javascript:");
    expect(html).not.toMatch(/href=["']javascript:/i);
  }, 30_000);

  it("returns reading stats from the source markdown", async () => {
    const md = "## Title\n\nA short paragraph of words.\n";
    const result = await renderMarkdown(md);

    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.readingMinutes).toBeGreaterThanOrEqual(1);
  }, 30_000);
});
