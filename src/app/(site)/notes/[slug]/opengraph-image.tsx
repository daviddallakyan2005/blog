import {
  createOgImage,
  ogContentType,
  ogSize,
} from "@/components/seo/og-image";
import { getPublishedNotes, getPublishedPostBySlug } from "@/lib/data/posts";
import { SITE_NAME } from "@/lib/seo/site";

export const alt = SITE_NAME;
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  const posts = await getPublishedNotes(200);
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: "_" }];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  return createOgImage({
    title: post?.kind === "note" ? post.title : "Note",
    date: post?.kind === "note" ? post.published_at : null,
  });
}
