import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { RenderedHtml } from "@/components/prose/rendered-html";
import { PostCard } from "@/components/site/post-card";
import { PostListSkeleton } from "@/components/site/post-list";
import { Button } from "@/components/ui/button";
import { getPublishedArticles, getPublishedNotes } from "@/lib/data/posts";
import { getSiteSettings } from "@/lib/data/settings";
import type { PublishedPostListItem } from "@/lib/data/types";
import { SITE_NAME } from "@/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings?.seo_title?.trim() || SITE_NAME;
  const description =
    settings?.seo_description?.trim() ||
    settings?.tagline?.trim() ||
    "A personal technical blog.";

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      url: "/",
      siteName: SITE_NAME,
    },
  };
}

export default async function HomePage() {
  const settings = await getSiteSettings();

  const name = settings?.display_name?.trim() || SITE_NAME;
  const tagline = settings?.tagline?.trim();
  const bioHtml = settings?.bio_html?.trim();
  const cvHtml = settings?.cv_html?.trim() ?? "";

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {name}
        </h1>
        {tagline ? (
          <p className="mt-3 text-lg text-muted-foreground">{tagline}</p>
        ) : null}
        {bioHtml ? (
          <div
            className="prose-blog mt-6"
            dangerouslySetInnerHTML={{ __html: bioHtml }}
          />
        ) : null}
      </section>

      <section id="cv" className="mt-16 scroll-mt-20">
        <h2 className="text-xl font-semibold tracking-tight">CV</h2>
        {cvHtml ? (
          <>
            <div className="mt-6">
              <RenderedHtml html={cvHtml} />
            </div>
            <div className="mt-10">
              <Button asChild>
                <a href="/cv.pdf" download>
                  Download PDF
                </a>
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-10 text-muted-foreground">No CV published yet.</p>
        )}
      </section>

      <HomeSection title="Articles" href="/articles">
        <Suspense fallback={<PostListSkeleton />}>
          <HomeArticles />
        </Suspense>
      </HomeSection>
      <HomeSection title="Notes" href="/notes">
        <Suspense fallback={<PostListSkeleton />}>
          <HomeNotes />
        </Suspense>
      </HomeSection>
    </div>
  );
}

function HomeSection({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <Link
          href={href}
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          View all
        </Link>
      </div>
      {children}
    </section>
  );
}

async function HomeArticles() {
  const posts = await getPublishedArticles(5);
  return <HomeSectionPosts posts={posts} empty="No articles yet." />;
}

async function HomeNotes() {
  const posts = await getPublishedNotes(5);
  return <HomeSectionPosts posts={posts} empty="No notes yet." />;
}

function HomeSectionPosts({
  posts,
  empty,
}: {
  posts: PublishedPostListItem[];
  empty: string;
}) {
  if (posts.length === 0) {
    return <p className="mt-6 text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="mt-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
