import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown/render";

import { extractCvExperienceBasics, splitCvSummary } from "./split-summary";

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

describe("extractCvExperienceBasics", () => {
  it("extracts org from the Experience h3 and metaHtml from the first following p", () => {
    const html = `<h2>Experience</h2>
<h3>Wirestock · Stock media marketplace (Series A)</h3>
<p><strong>Cloud Data Engineer</strong> · January 2025 – Present · On site · Yerevan, Armenia</p>
<p>Primary owner of the warehouse.</p>
<h4>ETL engineering</h4>
<ul>
<li>A bullet</li>
</ul>`;

    expect(extractCvExperienceBasics(html)).toEqual([
      {
        org: "Wirestock · Stock media marketplace (Series A)",
        metaHtml:
          "<strong>Cloud Data Engineer</strong> · January 2025 – Present · On site · Yerevan, Armenia",
      },
    ]);
  });

  it("extracts every Experience h3 in document order", () => {
    const html = `<h2>Experience</h2>
<h3>Wirestock · Stock media marketplace (Series A)</h3>
<p><strong>Cloud Data Engineer</strong> · January 2025 – Present · On site · Yerevan, Armenia</p>
<p>Primary owner of the warehouse.</p>
<h3>Earlier Co</h3>
<p>Data Engineer · 2023 – 2024 · Remote</p>
<ul>
<li>Old bullet</li>
</ul>`;

    expect(extractCvExperienceBasics(html)).toEqual([
      {
        org: "Wirestock · Stock media marketplace (Series A)",
        metaHtml:
          "<strong>Cloud Data Engineer</strong> · January 2025 – Present · On site · Yerevan, Armenia",
      },
      {
        org: "Earlier Co",
        metaHtml: "Data Engineer · 2023 – 2024 · Remote",
      },
    ]);
  });

  it("returns an empty array when there is no Experience heading", () => {
    const html = `<h2>Education</h2>
<h3>University</h3>
<p>BSc · 2020</p>`;

    expect(extractCvExperienceBasics(html)).toEqual([]);
  });

  it("returns an empty array for empty or whitespace input", () => {
    expect(extractCvExperienceBasics("")).toEqual([]);
    expect(extractCvExperienceBasics("   \n\t  ")).toEqual([]);
  });

  it("stops at the next h2 and does not include Open source or Education", () => {
    const html = `<h2>Experience</h2>
<h3>Wirestock · Stock media marketplace (Series A)</h3>
<p><strong>Cloud Data Engineer</strong> · January 2025 – Present</p>
<h2>Open source</h2>
<h3>some-lib</h3>
<p>Maintainer</p>
<h2>Education</h2>
<h3>University</h3>
<p>BSc</p>`;

    expect(extractCvExperienceBasics(html)).toEqual([
      {
        org: "Wirestock · Stock media marketplace (Series A)",
        metaHtml: "<strong>Cloud Data Engineer</strong> · January 2025 – Present",
      },
    ]);
  });

  it("extracts a job whose title contains Turkish I", () => {
    const html = `<h2>Experience</h2>
<h3>İstanbul Studio</h3>
<p>Engineer · 2024</p>
<h2>Education</h2>
<p>Degree.</p>`;

    expect(extractCvExperienceBasics(html)).toEqual([
      {
        org: "İstanbul Studio",
        metaHtml: "Engineer · 2024",
      },
    ]);
  });

  it("extracts autolinked Experience headings from renderMarkdown", async () => {
    const { html } = await renderMarkdown(`## Experience

### Wirestock · Stock media marketplace (Series A)

**Cloud Data Engineer** · January 2025 – Present · On site · Yerevan, Armenia

Primary owner of the warehouse.

#### ETL engineering

- A bullet

## Open source

### some-lib

Maintainer
`);

    expect(html).toContain('id="experience"');
    expect(html).toContain('href="#experience"');
    expect(extractCvExperienceBasics(html)).toEqual([
      {
        org: "Wirestock · Stock media marketplace (Series A)",
        metaHtml:
          "<strong>Cloud Data Engineer</strong> · January 2025 – Present · On site · Yerevan, Armenia",
      },
    ]);
  }, 30_000);
});
