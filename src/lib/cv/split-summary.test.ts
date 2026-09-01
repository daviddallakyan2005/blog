import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown/render";

import { splitCvSummary } from "./split-summary";

describe("splitCvSummary", () => {
  it("extracts paragraphs under a Summary h2 and omits the heading", () => {
    const html = `<h2>Summary</h2>
<p>I build data platforms.</p>
<p>A second paragraph.</p>
<h2>Experience</h2>
<p>Staff engineer.</p>`;

    expect(splitCvSummary(html)).toEqual({
      summaryHtml: `<p>I build data platforms.</p>
<p>A second paragraph.</p>`,
      restHtml: `<h2>Experience</h2>
<p>Staff engineer.</p>`,
    });
  });

  it("splits autolinked Summary headings from renderMarkdown", async () => {
    const { html } = await renderMarkdown(`## Summary

I build data platforms.

A second paragraph.

## Experience

Staff engineer at Example.
`);

    expect(html).toContain('id="summary"');
    expect(html).toContain('href="#summary"');
    expect(splitCvSummary(html)).toEqual({
      summaryHtml: `<p>I build data platforms.</p>
<p>A second paragraph.</p>`,
      restHtml: `<h2 id="experience"><a aria-hidden="true" tabindex="-1" href="#experience"><span class="icon icon-link"></span></a>Experience</h2>
<p>Staff engineer at Example.</p>`,
    });
  }, 30_000);

  it("returns empty summary and unchanged rest when there is no Summary heading", () => {
    const html = `<h2>Experience</h2>
<p>Staff engineer.</p>`;

    expect(splitCvSummary(html)).toEqual({
      summaryHtml: "",
      restHtml: html,
    });
  });

  it("returns empty strings for empty or whitespace input", () => {
    expect(splitCvSummary("")).toEqual({ summaryHtml: "", restHtml: "" });
    expect(splitCvSummary("   \n\t  ")).toEqual({
      summaryHtml: "",
      restHtml: "",
    });
  });

  it("matches a Summary heading case-insensitively", () => {
    const html = `<h2>SUMMARY</h2>
<p>Lead paragraph.</p>
<h2>Experience</h2>
<p>Role.</p>`;

    expect(splitCvSummary(html)).toEqual({
      summaryHtml: `<p>Lead paragraph.</p>`,
      restHtml: `<h2>Experience</h2>
<p>Role.</p>`,
    });
  });

  it("keeps Summary siblings until the next h1 or h2", () => {
    const html = `<p>Intro.</p>
<h2>Summary</h2>
<p>Lead.</p>
<h3>Focus</h3>
<ul>
<li>One</li>
</ul>
<h2>Experience</h2>
<p>Role.</p>`;

    expect(splitCvSummary(html)).toEqual({
      summaryHtml: `<p>Lead.</p>
<h3>Focus</h3>
<ul>
<li>One</li>
</ul>`,
      restHtml: `<p>Intro.</p>
<h2>Experience</h2>
<p>Role.</p>`,
    });
  });

  it("keeps rest when a Summary paragraph contains two Turkish I characters", () => {
    const html = `<h2>Summary</h2>
<p>İstanbul and İzmir.</p>
<h2>Experience</h2>
<p>Staff.</p>`;

    expect(splitCvSummary(html)).toEqual({
      summaryHtml: `<p>İstanbul and İzmir.</p>`,
      restHtml: `<h2>Experience</h2>
<p>Staff.</p>`,
    });
    expect(splitCvSummary(html).restHtml).not.toBe("");
  });
});
