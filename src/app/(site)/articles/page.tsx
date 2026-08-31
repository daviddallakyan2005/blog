import type { Metadata } from "next";
import { Suspense } from "react";

import { ArticlesFilters } from "@/components/site/articles-filters";
import { Pagination } from "@/components/site/pagination";
import { PostList, PostListSkeleton } from "@/components/site/post-list";
import { filterPublishedArticles } from "@/lib/articles/filter-articles";
import { getPublishedArticles } from "@/lib/data/posts";
import { getAllTags } from "@/lib/data/tags";
import { publicPageMetadata } from "@/lib/seo/metadata";

const PER_PAGE = 10;

type ArticlesPageProps = {
  searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
};

export async function generateMetadata({
  searchParams,
}: ArticlesPageProps): Promise<Metadata> {
  const { q, tag } = await searchParams;
  const meta = publicPageMetadata({
    title: "Articles",
    description: "Long-form writing.",
    path: "/articles",
  });

  if (q?.trim() || tag?.trim()) {
    return {
      ...meta,
      robots: { index: false, follow: true },
    };
  }

  return meta;
}

export default function ArticlesPage({ searchParams }: ArticlesPageProps) {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Articles</h1>
      <p className="mt-3 text-muted-foreground">Long-form writing.</p>
      <Suspense fallback={<PostListSkeleton />}>
        <ArticlesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ArticlesList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tag?: string }>;
}) {
  const { page: raw, q, tag } = await searchParams;
  const [all, tags] = await Promise.all([
    getPublishedArticles(500),
    getAllTags(),
  ]);
  const filtered = filterPublishedArticles(all, { q, tag });
  const requested = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(requested, totalPages);
  const posts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const empty = all.length === 0 ? "No articles yet." : "No articles match.";

  return (
    <>
      <ArticlesFilters q={q} tag={tag} tags={tags} />
      <PostList posts={posts} empty={empty} />
      <Pagination page={page} totalPages={totalPages} q={q} tag={tag} />
    </>
  );
}
