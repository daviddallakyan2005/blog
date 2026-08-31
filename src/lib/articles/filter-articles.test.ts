import { describe, expect, it } from "vitest";

import { articlesHref, filterPublishedArticles } from "./filter-articles";

const posts = [
  {
    title: "rust async",
    summary: "concurrency notes",
    tags: [{ slug: "lang" }],
  },
  {
    title: "Kubernetes on the cluster",
    summary: "Learn Rust",
    tags: [{ slug: "k8s" }],
  },
  {
    title: "Nessie catalog",
    summary: null,
    tags: [{ slug: "iceberg" }],
  },
  {
    title: "Spark jobs",
    summary: "batch pipelines",
    tags: [{ slug: "rust" }],
  },
];

describe("filterPublishedArticles", () => {
  it("returns the same posts in the same order when q and tag are omitted, null, empty, or whitespace", () => {
    expect(filterPublishedArticles(posts, {})).toEqual(posts);
    expect(filterPublishedArticles(posts, { q: null, tag: null })).toEqual(
      posts,
    );
    expect(filterPublishedArticles(posts, { q: "", tag: "" })).toEqual(posts);
    expect(
      filterPublishedArticles(posts, { q: "  ", tag: "   " }),
    ).toEqual(posts);
    expect(filterPublishedArticles(posts, { q: undefined })).toEqual(posts);
    expect(filterPublishedArticles(posts, { tag: undefined })).toEqual(posts);
  });

  it("matches trimmed q case-insensitively on title or summary, not tag names", () => {
    expect(filterPublishedArticles(posts, { q: "Rust" })).toEqual([
      {
        title: "rust async",
        summary: "concurrency notes",
        tags: [{ slug: "lang" }],
      },
      {
        title: "Kubernetes on the cluster",
        summary: "Learn Rust",
        tags: [{ slug: "k8s" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { q: " rust " })).toEqual([
      {
        title: "rust async",
        summary: "concurrency notes",
        tags: [{ slug: "lang" }],
      },
      {
        title: "Kubernetes on the cluster",
        summary: "Learn Rust",
        tags: [{ slug: "k8s" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { q: "kube" })).toEqual([
      {
        title: "Kubernetes on the cluster",
        summary: "Learn Rust",
        tags: [{ slug: "k8s" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { q: "Nessie" })).toEqual([
      {
        title: "Nessie catalog",
        summary: null,
        tags: [{ slug: "iceberg" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { q: "missing" })).toEqual([]);
  });

  it("filters by exact case-sensitive tag slug and ignores empty tag", () => {
    expect(filterPublishedArticles(posts, { tag: "k8s" })).toEqual([
      {
        title: "Kubernetes on the cluster",
        summary: "Learn Rust",
        tags: [{ slug: "k8s" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { tag: "rust" })).toEqual([
      {
        title: "Spark jobs",
        summary: "batch pipelines",
        tags: [{ slug: "rust" }],
      },
    ]);
    expect(filterPublishedArticles(posts, { tag: "K8s" })).toEqual([]);
    expect(filterPublishedArticles(posts, { tag: "unknown" })).toEqual([]);
    expect(filterPublishedArticles(posts, { tag: null })).toEqual(posts);
    expect(filterPublishedArticles(posts, { tag: "" })).toEqual(posts);
  });

  it("requires both q and tag to match when both are set", () => {
    expect(
      filterPublishedArticles(posts, { q: "Rust", tag: "k8s" }),
    ).toEqual([
      {
        title: "Kubernetes on the cluster",
        summary: "Learn Rust",
        tags: [{ slug: "k8s" }],
      },
    ]);
    expect(
      filterPublishedArticles(posts, { q: "Rust", tag: "iceberg" }),
    ).toEqual([]);
    expect(
      filterPublishedArticles(posts, { q: "Nessie", tag: "iceberg" }),
    ).toEqual([
      {
        title: "Nessie catalog",
        summary: null,
        tags: [{ slug: "iceberg" }],
      },
    ]);
  });

  it("does not mutate the input array", () => {
    const snapshot = posts.map((post) => ({
      ...post,
      tags: [...post.tags],
    }));
    filterPublishedArticles(posts, { q: "Rust", tag: "k8s" });
    expect(posts).toEqual(snapshot);
    expect(posts).toHaveLength(4);
  });
});

describe("articlesHref", () => {
  it("returns /articles when q, tag, and page are missing, blank, or not a real page", () => {
    expect(articlesHref({})).toBe("/articles");
    expect(articlesHref({ page: 1 })).toBe("/articles");
    expect(articlesHref({ page: 0 })).toBe("/articles");
    expect(articlesHref({ q: "  " })).toBe("/articles");
    expect(articlesHref({ tag: "" })).toBe("/articles");
  });

  it("appends trimmed q, tag, then page when page is 2 or more", () => {
    expect(articlesHref({ q: " rust " })).toBe("/articles?q=rust");
    expect(articlesHref({ tag: "k8s" })).toBe("/articles?tag=k8s");
    expect(articlesHref({ q: "rust", tag: "k8s" })).toBe(
      "/articles?q=rust&tag=k8s",
    );
    expect(articlesHref({ q: "rust", tag: "k8s", page: 2 })).toBe(
      "/articles?q=rust&tag=k8s&page=2",
    );
    expect(articlesHref({ page: 3 })).toBe("/articles?page=3");
    expect(articlesHref({ q: "rust", page: 1 })).toBe("/articles?q=rust");
  });

  it("encodes special characters in q the way URLSearchParams does", () => {
    expect(articlesHref({ q: "rust async" })).toBe("/articles?q=rust+async");
    expect(articlesHref({ q: "a&b=c" })).toBe("/articles?q=a%26b%3Dc");
  });
});
