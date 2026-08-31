import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PostList } from "@/components/site/post-list";
import {
  getAllTags,
  getPublishedPostsByTag,
  getTagBySlug,
} from "@/lib/data/tags";
import { publicPageMetadata } from "@/lib/seo/metadata";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.length > 0
    ? tags.map((tag) => ({ slug: tag.slug }))
    : [{ slug: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) {
    return { title: "Tag" };
  }

  return publicPageMetadata({
    title: tag.name,
    description: tag.description ?? `Posts tagged ${tag.name}.`,
    path: `/tags/${tag.slug}`,
  });
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const [tag, posts] = await Promise.all([
    getTagBySlug(slug),
    getPublishedPostsByTag(slug),
  ]);

  if (!tag) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{tag.name}</h1>
      {tag.description ? (
        <p className="mt-3 text-muted-foreground">{tag.description}</p>
      ) : (
        <p className="mt-3 text-muted-foreground">Posts tagged {tag.name}.</p>
      )}
      <PostList posts={posts} empty="No published posts with this tag." />
    </div>
  );
}
