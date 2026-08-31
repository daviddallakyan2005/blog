import { getPublishedArticles } from "@/lib/data/posts";
import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  postPath,
} from "@/lib/seo/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await getPublishedArticles(20);

  const items = posts
    .map((post) => {
      const link = absoluteUrl(postPath(post.slug));
      const description = post.summary ?? "";
      const pubDate = post.published_at
        ? `<pubDate>${new Date(post.published_at).toUTCString()}</pubDate>`
        : "";

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid>${escapeXml(link)}</guid>
      <description>${escapeXml(description)}</description>
      ${pubDate}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link rel="self" type="application/rss+xml" href="${escapeXml(`${SITE_URL}/feed.xml`)}"/>
    <managingEditor>${escapeXml(AUTHOR_NAME)}</managingEditor>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
