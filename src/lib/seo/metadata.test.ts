import { describe, expect, it } from "vitest";

import { publicPageMetadata } from "./metadata";
import { postPath } from "./site";

describe("publicPageMetadata", () => {
  it("sets canonical, Open Graph, and Twitter for a listing path", () => {
    const meta = publicPageMetadata({
      title: "Articles",
      description: "Long-form writing.",
      path: "/articles",
    });

    expect(meta.title).toBe("Articles");
    expect(meta.description).toBe("Long-form writing.");
    expect(meta.alternates?.canonical).toBe("/articles");
    expect(meta.openGraph).toMatchObject({
      title: "Articles",
      description: "Long-form writing.",
      url: "/articles",
      siteName: "David Dallakyan",
      type: "website",
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Articles",
      description: "Long-form writing.",
    });
  });

  it("uses / as the home canonical and Open Graph url", () => {
    const meta = publicPageMetadata({
      title: "David Dallakyan",
      description: "A personal technical blog.",
      path: "/",
    });

    expect(meta.alternates?.canonical).toBe("/");
    expect(meta.openGraph).toMatchObject({ url: "/" });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
  });
});

describe("postPath", () => {
  it("returns an articles path for a slug", () => {
    expect(postPath("hello")).toBe("/articles/hello");
  });
});
