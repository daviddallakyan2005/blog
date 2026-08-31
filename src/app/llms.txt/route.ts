import { getPublishedArticles, getPublishedNotes } from "@/lib/data/posts";
import { getAllProjects } from "@/lib/data/projects";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  postPath,
} from "@/lib/seo/site";

export async function GET() {
  const [articles, notes, projects] = await Promise.all([
    getPublishedArticles(500),
    getPublishedNotes(500),
    getAllProjects(),
  ]);

  const urls = [
    ...articles.map((post) => absoluteUrl(postPath("article", post.slug))),
    ...notes.map((post) => absoluteUrl(postPath("note", post.slug))),
    ...projects.map((project) => absoluteUrl(`/projects/${project.slug}`)),
  ];

  const body = [`# ${SITE_NAME}`, "", SITE_DESCRIPTION, "", ...urls, ""].join(
    "\n",
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
