import type { Metadata } from "next";
import { Suspense } from "react";

import { TagPillsSkeleton } from "@/components/site/skeletons";
import { TagPill } from "@/components/site/tag-pill";
import { getAllTags } from "@/lib/data/tags";
import { publicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = publicPageMetadata({
  title: "Tags",
  description: "Browse posts by topic.",
  path: "/tags",
});

export default function TagsPage() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Tags</h1>
      <p className="mt-3 text-muted-foreground">Browse posts by topic.</p>
      <Suspense fallback={<TagPillsSkeleton />}>
        <TagsList />
      </Suspense>
    </div>
  );
}

async function TagsList() {
  const tags = await getAllTags();

  if (tags.length === 0) {
    return <p className="mt-10 text-muted-foreground">No tags yet.</p>;
  }

  return (
    <ul className="mt-10 flex flex-wrap gap-2">
      {tags.map((tag) => (
        <li key={tag.id}>
          <TagPill name={tag.name} slug={tag.slug} />
        </li>
      ))}
    </ul>
  );
}
