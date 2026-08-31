import type { Metadata } from "next";
import { Suspense } from "react";

import { Pagination } from "@/components/site/pagination";
import { PostList, PostListSkeleton } from "@/components/site/post-list";
import { countPublishedPosts, getPublishedArticles } from "@/lib/data/posts";
import { publicPageMetadata } from "@/lib/seo/metadata";

const PER_PAGE = 10;

export const metadata: Metadata = publicPageMetadata({
  title: "Articles",
  description: "Long-form writing.",
  path: "/articles",
});

export default function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
  const [posts, total] = await Promise.all([
    getPublishedArticles(PER_PAGE, (page - 1) * PER_PAGE),
    countPublishedPosts(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PostList posts={posts} empty="No articles yet." />
      <Pagination page={page} totalPages={totalPages} basePath="/articles" />
    </>
  );
}
