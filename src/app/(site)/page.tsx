import type { Metadata } from "next";
import Link from "next/link";

import { RenderedHtml } from "@/components/prose/rendered-html";
import { PostCard } from "@/components/site/post-card";
import { Button } from "@/components/ui/button";
import { getPublishedArticles, getPublishedNotes } from "@/lib/data/posts";
import { getSiteSettings } from "@/lib/data/settings";
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
  const [settings, articles, notes] = await Promise.all([
    getSiteSettings(),
    getPublishedArticles(5),
    getPublishedNotes(5),
  ]);

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

      <HomeSection
        title="Articles"
        href="/articles"
        empty="No articles yet."
        posts={articles}
      />
      <HomeSection
        title="Notes"
        href="/notes"
        empty="No notes yet."
        posts={notes}
      />
    </div>
  );
}

function HomeSection({
  title,
  href,
  empty,
  posts,
}: {
  title: string;
  href: string;
  empty: string;
  posts: Awaited<ReturnType<typeof getPublishedArticles>>;
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
      {posts.length === 0 ? (
        <p className="mt-6 text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}
