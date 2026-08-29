import type { Metadata } from "next";
import Link from "next/link";

import { SocialLinks } from "@/components/site/social-links";
import { TimelineList } from "@/components/site/timeline-list";
import { RenderedHtml } from "@/components/prose/rendered-html";
import { getSiteSettings } from "@/lib/data/settings";
import { getTimelineEntries } from "@/lib/data/timeline";
import { SITE_NAME } from "@/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const name = settings?.display_name?.trim() || SITE_NAME;

  return {
    title: "About",
    description: settings?.tagline?.trim() || `About ${name}.`,
  };
}

export default async function AboutPage() {
  const [settings, entries] = await Promise.all([
    getSiteSettings(),
    getTimelineEntries(),
  ]);

  const name = settings?.display_name?.trim() || SITE_NAME;
  const tagline = settings?.tagline?.trim();
  const bioHtml = settings?.bio_html?.trim();

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{name}</h1>
      {tagline ? (
        <p className="mt-3 text-lg text-muted-foreground">{tagline}</p>
      ) : null}
      {bioHtml ? (
        <div className="mt-6">
          <RenderedHtml html={bioHtml} />
        </div>
      ) : null}
      {settings ? <SocialLinks social={settings.social} /> : null}
      <p className="mt-6 text-sm">
        <Link
          href="/cv"
          className="text-accent underline-offset-4 hover:underline"
        >
          View CV
        </Link>
      </p>
      <TimelineList entries={entries} />
    </div>
  );
}
