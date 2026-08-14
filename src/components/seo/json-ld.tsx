import type { PublishedPost } from "@/lib/data/types";
import {
  AUTHOR_NAME,
  AUTHOR_SAME_AS,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  postPath,
} from "@/lib/seo/site";

type JsonLdValue = Record<string, unknown> | Record<string, unknown>[];

export function JsonLd({ data }: { data: JsonLdValue }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replaceAll("<", "\\u003c"),
      }}
    />
  );
}

export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs: AUTHOR_SAME_AS,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    publisher: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
  };
}

export function blogPostingJsonLd(post: PublishedPost) {
  const url = absoluteUrl(postPath(post.kind, post.slug));

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary ?? undefined,
    datePublished: post.published_at ?? undefined,
    url,
    mainEntityOfPage: url,
    author: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
    publisher: {
      "@type": "Person",
      name: AUTHOR_NAME,
    },
  };
}
