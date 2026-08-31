export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "David Dallakyan";
export const SITE_DESCRIPTION = "A personal technical blog.";
export const AUTHOR_NAME = "David Dallakyan";
export const AUTHOR_SAME_AS: string[] = [
  "https://github.com/daviddallakyan2005",
  "https://newsroom.aua.am/2025/03/20/david-dallakyan-empowering-journey-computer-science/",
];

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") {
    return SITE_URL;
  }

  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postPath(slug: string): string {
  return `/articles/${slug}`;
}
