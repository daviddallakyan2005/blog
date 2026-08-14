export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
};

export type PublishedPostListItem = {
  id: string;
  slug: string;
  kind: "article" | "note";
  title: string;
  summary: string | null;
  cover_path: string | null;
  published_at: string | null;
  reading_minutes: number;
  tags: Tag[];
};

export type PublishedPost = PublishedPostListItem & {
  body_html: string;
  toc_json: TocItem[];
  canonical_url: string | null;
};

export type SiteSocial = {
  github?: string;
  twitter?: string;
  linkedin?: string;
  email?: string;
};

export type SiteSettings = {
  display_name: string | null;
  tagline: string | null;
  bio_md: string | null;
  bio_html: string | null;
  seo_title: string | null;
  seo_description: string | null;
  avatar_path: string | null;
  social: SiteSocial;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description_html: string;
  repo_url: string | null;
  homepage_url: string | null;
  primary_language: string | null;
  tech: string[];
  role: string | null;
  status: string;
  featured: boolean;
  sort_order: number;
  stars: number | null;
  forks: number | null;
};

export type TimelineKind =
  | "role"
  | "education"
  | "talk"
  | "award"
  | "oss_contribution";

export type TimelineEntry = {
  id: string;
  kind: TimelineKind;
  title: string;
  org: string | null;
  org_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  description_html: string;
  highlights: string[];
  sort_order: number;
};
