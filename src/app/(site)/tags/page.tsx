import type { Metadata } from "next";

import { TagPill } from "@/components/site/tag-pill";
import { getAllTags } from "@/lib/data/tags";

export const metadata: Metadata = {
  title: "Tags",
  description: "Browse posts by topic.",
};

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Tags</h1>
      <p className="mt-3 text-muted-foreground">Browse posts by topic.</p>
      {tags.length === 0 ? (
        <p className="mt-10 text-muted-foreground">No tags yet.</p>
      ) : (
        <ul className="mt-10 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <TagPill name={tag.name} slug={tag.slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
