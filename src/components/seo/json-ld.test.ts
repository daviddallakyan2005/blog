import { describe, expect, it } from "vitest";

import type { PublishedPost } from "@/lib/data/types";
import { SITE_URL } from "@/lib/seo/site";

import { blogPostingJsonLd, breadcrumbJsonLd, websiteJsonLd } from "./json-ld";

function article(overrides: Partial<PublishedPost> = {}): PublishedPost {
  return {
    id: "1",
    slug: "hello",
    kind: "article",
    title: "Hello",
    summary: "A post.",
    cover_path: null,
    published_at: "2026-01-15T00:00:00.000Z",
    reading_minutes: 4,
    tags: [],
    body_html: "<p>Hi</p>",
    toc_json: [],
    canonical_url: null,
    word_count: 0,
    ...overrides,
  };
}

describe("websiteJsonLd", () => {
  it("includes a SearchAction for site search", () => {
    const json = websiteJsonLd();

    expect(json.potentialAction).toEqual({
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
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
