import {
  createOgImage,
  ogContentType,
  ogSize,
} from "@/components/seo/og-image";
import { getPublishedArticles, getPublishedPostBySlug } from "@/lib/data/posts";
import { SITE_NAME } from "@/lib/seo/site";

export const alt = SITE_NAME;
export const size = ogSize;
export const contentType = ogContentType;

export async function generateStaticParams() {
  const posts = await getPublishedArticles(200);
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
    title: post?.title ?? "Article",
    date: post?.published_at ?? null,
  });
}
