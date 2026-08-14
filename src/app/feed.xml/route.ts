import { getPublishedArticles, getPublishedNotes } from "@/lib/data/posts";
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
  const [articles, notes] = await Promise.all([
    getPublishedArticles(20),
    getPublishedNotes(20),
  ]);

  const posts = [...articles, ...notes]
    .sort((a, b) => {
      const left = a.published_at ? Date.parse(a.published_at) : 0;
      const right = b.published_at ? Date.parse(b.published_at) : 0;
      return right - left;
    })
    .slice(0, 20);

  const items = posts
    .map((post) => {
      const link = absoluteUrl(postPath(post.kind, post.slug));
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
<rss version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${escapeXml(SITE_URL)}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
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
