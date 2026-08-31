export type ArticleFilter = {
  q?: string | null;
  tag?: string | null;
};

export type ArticlesHrefInput = {
  q?: string | null;
  tag?: string | null;
  page?: number;
};

export function filterPublishedArticles<
  T extends {
    title: string;
    summary: string | null;
    tags: { slug: string }[];
  },
>(posts: T[], filter: ArticleFilter): T[] {
  const q = filter.q?.trim().toLowerCase();
  const tag = filter.tag?.trim();
  let result = posts;
  if (q) {
    result = result.filter((post) => {
      if (post.title.toLowerCase().includes(q)) {
        return true;
      }
      return post.summary?.toLowerCase().includes(q) ?? false;
    });
  }
  if (tag) {
    result = result.filter((post) =>
      post.tags.some((item) => item.slug === tag),
    );
  }
  return result;
}

export function articlesHref(input: ArticlesHrefInput): string {
  const params = new URLSearchParams();
  const q = input.q?.trim();
  if (q) {
    params.set("q", q);
  }
  const tag = input.tag?.trim();
  if (tag) {
    params.set("tag", tag);
  }
  if (typeof input.page === "number" && input.page >= 2) {
    params.set("page", String(input.page));
  }
  const query = params.toString();
  return query ? `/articles?${query}` : "/articles";
}
