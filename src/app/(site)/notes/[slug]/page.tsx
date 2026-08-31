import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  JsonLd,
  blogPostingJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";
import { PostArticle } from "@/components/site/post-article";
import { getPublishedNotes, getPublishedPostBySlug } from "@/lib/data/posts";
import { publicPageMetadata } from "@/lib/seo/metadata";
import { postPath } from "@/lib/seo/site";

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

  const description = post.summary ?? "";
  const path = postPath("note", post.slug);
  const meta = publicPageMetadata({
    title: post.title,
    description,
    path,
  });

  return {
    ...meta,
    description: post.summary ?? undefined,
    alternates: {
      canonical: post.canonical_url ?? path,
    },
    openGraph: {
      ...meta.openGraph,
      type: "article",
      description: post.summary ?? undefined,
      publishedTime: post.published_at ?? undefined,
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
      <JsonLd
        data={[
          blogPostingJsonLd(post),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Notes", path: "/notes" },
            { name: post.title, path: postPath("note", post.slug) },
          ]),
        ]}
      />
      <PostArticle post={post} showToc={post.toc_json.length >= 2} />
    </>
  );
}
