import type { Metadata } from "next";
import Link from "next/link";
import { type ReactNode, Suspense } from "react";

import { RenderedHtml } from "@/components/prose/rendered-html";
import { CvDisclosure } from "@/components/site/cv-disclosure";
import { CvExperienceList } from "@/components/site/cv-experience-list";
import { PostCard } from "@/components/site/post-card";
import { CompactPostListSkeleton } from "@/components/site/post-list";
import { SocialLinks } from "@/components/site/social-links";
import { TimelineList } from "@/components/site/timeline-list";
import {
  extractCvExperienceBasics,
  splitCvSummary,
} from "@/lib/cv/split-summary";
import { getPublishedArticles } from "@/lib/data/posts";
import { getSiteSettings } from "@/lib/data/settings";
import { getTimelineEntries } from "@/lib/data/timeline";
import type { PublishedPostListItem } from "@/lib/data/types";
import { publicPageMetadata } from "@/lib/seo/metadata";
import { SITE_NAME } from "@/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = settings?.seo_title?.trim() || SITE_NAME;
  const description =
    settings?.seo_description?.trim() ||
    settings?.tagline?.trim() ||
    "A personal technical blog.";

  return {
    ...publicPageMetadata({ title, description, path: "/" }),
    title: {
      absolute: title,
    },
  };
}

export default async function HomePage() {
  const [settings, entries] = await Promise.all([
    getSiteSettings(),
    getTimelineEntries(),
  ]);

  const name = settings?.display_name?.trim() || SITE_NAME;
  const tagline = settings?.tagline?.trim();
  const bioHtml = settings?.bio_html?.trim();
  const cvHtml = settings?.cv_html?.trim() ?? "";
  const { summaryHtml, restHtml } = splitCvSummary(cvHtml);
  const experienceJobs = extractCvExperienceBasics(cvHtml);

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
        {summaryHtml ? (
          <div
            className="prose-blog mt-6"
            dangerouslySetInnerHTML={{ __html: summaryHtml }}
          />
        ) : null}
        {settings ? (
          <SocialLinks
            social={settings.social}
            trailing={
              cvHtml ? (
                <li>
                  <a
                    href="/cv.pdf"
                    download
                    className="text-accent underline-offset-4 hover:underline"
                  >
                    Download PDF
                  </a>
                </li>
              ) : null
            }
          />
        ) : null}
      </section>

      {experienceJobs.length > 0 || entries.length > 0 ? (
        <div className="mt-12 space-y-8">
          {experienceJobs.length > 0 ? (
            <CvExperienceList jobs={experienceJobs} />
          ) : null}
          {entries.length > 0 ? (
            <TimelineList compact entries={entries} />
          ) : null}
        </div>
      ) : null}

      {restHtml ? (
        <CvDisclosure>
          <div className="cv-doc">
            <RenderedHtml html={restHtml} />
          </div>
        </CvDisclosure>
      ) : null}

      <HomeSection title="Articles" href="/articles">
        <Suspense fallback={<CompactPostListSkeleton />}>
          <HomeArticles />
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
  const posts = await getPublishedArticles(3);
  return <HomeSectionPosts posts={posts} empty="No articles yet." />;
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
        <PostCard key={post.id} post={post} compact />
      ))}
    </div>
  );
}
