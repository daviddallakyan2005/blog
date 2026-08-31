import { getPublishedArticles } from "@/lib/data/posts";
import { getAllProjects } from "@/lib/data/projects";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  postPath,
} from "@/lib/seo/site";

export async function GET() {
  const [articles, projects] = await Promise.all([
    getPublishedArticles(500),
    getAllProjects(),
  ]);

  const urls = [
    ...articles.map((post) => absoluteUrl(postPath(post.slug))),
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
