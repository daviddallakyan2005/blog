import { describe, expect, it } from "vitest";

import type { PublishedPost } from "@/lib/data/types";
import { AUTHOR_SAME_AS, SITE_URL } from "@/lib/seo/site";

import {
  blogPostingJsonLd,
  breadcrumbJsonLd,
  personJsonLd,
  pressSameAsUrls,
  websiteJsonLd,
} from "./json-ld";

function article(overrides: Partial<PublishedPost> = {}): PublishedPost {
  return {
    id: "1",
    slug: "hello",
    title: "Hello",
    summary: "A post.",
    cover_path: null,
    published_at: "2026-01-15T00:00:00.000Z",
    reading_minutes: 4,
    view_count: 0,
    like_count: 0,
    tags: [],
    body_html: "<p>Hi</p>",
    toc_json: [],
    canonical_url: null,
    word_count: 0,
    ...overrides,
  };
}

describe("personJsonLd", () => {
  it("keeps GitHub from AUTHOR_SAME_AS", () => {
    const json = personJsonLd();

    expect(json.sameAs).toContain("https://github.com/daviddallakyan2005");
    expect(json.sameAs[0]).toBe(AUTHOR_SAME_AS[0]);
  });

  it("appends extra profile URLs", () => {
    const json = personJsonLd([
      "https://twitter.com/example",
      "https://www.linkedin.com/in/example",
    ]);

    expect(json.sameAs).toContain("https://github.com/daviddallakyan2005");
    expect(json.sameAs).toContain("https://twitter.com/example");
    expect(json.sameAs).toContain("https://www.linkedin.com/in/example");
  });

  it("skips duplicates and non-http values", () => {
    const json = personJsonLd([
      "https://github.com/daviddallakyan2005",
      "ftp://example.com/profile",
      "not-a-url",
      "",
      "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
    ]);

    expect(
      json.sameAs.filter(
        (url) => url === "https://github.com/daviddallakyan2005",
      ),
    ).toHaveLength(1);
    expect(json.sameAs).not.toContain("ftp://example.com/profile");
    expect(json.sameAs).not.toContain("not-a-url");
    expect(json.sameAs).not.toContain("");
    expect(json.sameAs).toContain(
      "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
    );
  });
});

describe("pressSameAsUrls", () => {
  it("returns unique http(s) org_url values from press entries only", () => {
    expect(
      pressSameAsUrls([
        {
          kind: "press",
          org_url:
            "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
        },
        {
          kind: "press",
          org_url:
            "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
        },
        { kind: "talk", org_url: "https://example.com/talk" },
        { kind: "press", org_url: "http://example.com/interview" },
        { kind: "press", org_url: "" },
        { kind: "press", org_url: null },
        { kind: "role", org_url: "https://example.com/job" },
        { kind: "press", org_url: "ftp://example.com/nope" },
      ]),
    ).toEqual([
      "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
      "http://example.com/interview",
    ]);
  });
});

describe("websiteJsonLd", () => {
  it("includes a SearchAction for site search", () => {
    const json = websiteJsonLd();

    expect(json.potentialAction).toEqual({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/articles?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    });
  });
});

describe("blogPostingJsonLd", () => {
  it("sets OG image url and ISO 8601 timeRequired", () => {
    const json = blogPostingJsonLd(article());

    expect(json.image).toBe(`${SITE_URL}/articles/hello/opengraph-image`);
    expect(json.timeRequired).toBe("PT4M");
  });

  it("includes wordCount when the post has words", () => {
    const json = blogPostingJsonLd(article({ word_count: 800 }));
    expect(json.wordCount).toBe(800);
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds a BreadcrumbList with absolute item urls", () => {
    const json = breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Articles", path: "/articles" },
      { name: "Hello", path: "/articles/hello" },
    ]);

    expect(json["@type"]).toBe("BreadcrumbList");
    expect(json.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${SITE_URL}/articles`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Hello",
        item: `${SITE_URL}/articles/hello`,
      },
    ]);
  });
});
