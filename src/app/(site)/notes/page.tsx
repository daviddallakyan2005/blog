import type { Metadata } from "next";
import { Suspense } from "react";

import { Pagination } from "@/components/site/pagination";
import { PostList, PostListSkeleton } from "@/components/site/post-list";
import { countPublishedPosts, getPublishedNotes } from "@/lib/data/posts";

const PER_PAGE = 10;

export const metadata: Metadata = {
  title: "Notes",
  description: "Shorter notes and asides.",
};

export default function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
      <p className="mt-3 text-muted-foreground">Shorter notes and asides.</p>
      <Suspense fallback={<PostListSkeleton />}>
        <NotesList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function NotesList({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number.parseInt(raw ?? "1", 10) || 1);
  const [posts, total] = await Promise.all([
    getPublishedNotes(PER_PAGE, (page - 1) * PER_PAGE),
    countPublishedPosts("note"),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <>
      <PostList posts={posts} empty="No notes yet." />
      <Pagination page={page} totalPages={totalPages} basePath="/notes" />
    </>
  );
}
