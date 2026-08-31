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

export function personJsonLd(extraSameAs: string[] = []) {
  const sameAs = [...AUTHOR_SAME_AS];
  for (const url of extraSameAs) {
    if (/^https?:\/\//i.test(url) && !sameAs.includes(url)) {
      sameAs.push(url);
    }
  }

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR_NAME,
    url: SITE_URL,
    sameAs,
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
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function blogPostingJsonLd(post: PublishedPost) {
  const url = absoluteUrl(postPath(post.slug));

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary ?? undefined,
    datePublished: post.published_at ?? undefined,
    url,
    mainEntityOfPage: url,
    image: `${url}/opengraph-image`,
    ...(post.word_count > 0 ? { wordCount: post.word_count } : {}),
    timeRequired: `PT${post.reading_minutes}M`,
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

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
