import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd, blogPostingJsonLd } from "@/components/seo/json-ld";
import { PostArticle } from "@/components/site/post-article";
import { getPublishedNotes, getPublishedPostBySlug } from "@/lib/data/posts";
import { SITE_NAME, postPath } from "@/lib/seo/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = await getPublishedNotes(200);
  return posts.length > 0
    ? posts.map((post) => ({ slug: post.slug }))
    : [{ slug: "_" }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post || post.kind !== "note") {
    return { title: "Note" };
  }

  const description = post.summary ?? undefined;
  const url = postPath("note", post.slug);

  return {
    title: post.title,
    description,
    ...(post.canonical_url
      ? { alternates: { canonical: post.canonical_url } }
      : {}),
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description,
      siteName: SITE_NAME,
      publishedTime: post.published_at ?? undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post || post.kind !== "note") {
    notFound();
  }

  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />
      <PostArticle post={post} showToc={post.toc_json.length >= 2} />
    </>
  );
}
