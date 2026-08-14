export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "David Dallakyan";
export const SITE_DESCRIPTION = "A personal technical blog.";
export const AUTHOR_NAME = "David Dallakyan";
export const AUTHOR_SAME_AS: string[] = ["https://github.com/daviddallakyan2005"];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postPath(kind: "article" | "note", slug: string): string {
  return kind === "article" ? `/articles/${slug}` : `/notes/${slug}`;
}
