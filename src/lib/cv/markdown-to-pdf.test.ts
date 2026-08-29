import { describe, expect, it } from "vitest";

import { parseCvMarkdown, renderCvPdf } from "./markdown-to-pdf";

describe("parseCvMarkdown", () => {
  it("parses an ATX heading as a heading block", () => {
    expect(parseCvMarkdown("# Title")).toEqual([
      {
        type: "heading",
        level: 1,
        children: [{ type: "text", value: "Title" }],
      },
    ]);
  });

  it("maps h4+ headings to level 3", () => {
    expect(parseCvMarkdown("#### ETL engineering in production Python")).toEqual(
      [
        {
          type: "heading",
          level: 3,
          children: [
            { type: "text", value: "ETL engineering in production Python" },
          ],
        },
      ],
    );
  });

  it("preserves paragraph text", () => {
    expect(parseCvMarkdown("Hello world")).toEqual([
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello world" }],
      },
    ]);
  });

  it("parses an unordered list item", () => {
    expect(parseCvMarkdown("- item")).toEqual([
      {
        type: "list",
        items: [{ children: [{ type: "text", value: "item" }] }],
      },
    ]);
  });

  it("preserves link href", () => {
    expect(
      parseCvMarkdown("[PyPI](https://pypi.org/project/superset-toolkit)"),
    ).toEqual([
      {
        type: "paragraph",
        children: [
          {
            type: "link",
            href: "https://pypi.org/project/superset-toolkit",
            children: [{ type: "text", value: "PyPI" }],
          },
        ],
      },
    ]);
  });

  it("drops javascript: hrefs and keeps link text", () => {
    expect(parseCvMarkdown("[x](javascript:alert(1))")).toEqual([
      {
        type: "paragraph",
        children: [{ type: "text", value: "x" }],
      },
    ]);
  });

  it("marks **bold** as strong", () => {
    expect(parseCvMarkdown("**bold**")).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "strong", children: [{ type: "text", value: "bold" }] },
        ],
      },
    ]);
  });

  it("marks *italic* as emphasis", () => {
    expect(parseCvMarkdown("*italic*")).toEqual([
      {
        type: "paragraph",
        children: [
          { type: "emphasis", children: [{ type: "text", value: "italic" }] },
        ],
      },
    ]);
  });
});

describe("renderCvPdf", () => {
  it("resolves to a Buffer whose first bytes are %PDF", async () => {
    const buffer = await renderCvPdf("# Hello");

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 4).toString("ascii")).toBe("%PDF");
  });
});
