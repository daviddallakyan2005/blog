import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import type { GithubPr } from "./types";

export type { GithubPr } from "./types";

const PR_COLUMNS =
  "id, github_id, repo, number, title, html_url, state, merged, draft, review_decision, issue_comments, review_comments, github_updated_at, github_created_at, closed_at, merged_at, synced_at";

function asState(value: string): GithubPr["state"] | null {
  return value === "open" || value === "closed" ? value : null;
}

function asReviewDecision(value: string | null): GithubPr["review_decision"] {
  if (
    value === "APPROVED" ||
    value === "CHANGES_REQUESTED" ||
    value === "REVIEW_REQUIRED"
  ) {
    return value;
  }
  return null;
}

function mapGithubPr(row: {
  id: string;
  github_id: number;
  repo: string;
  number: number;
  title: string;
  html_url: string;
  state: string;
  merged: boolean;
  draft: boolean;
  review_decision: string | null;
  issue_comments: number;
  review_comments: number;
  github_updated_at: string;
  github_created_at: string;
  closed_at: string | null;
  merged_at: string | null;
  synced_at: string;
}): GithubPr | null {
  const state = asState(row.state);
  if (!state) {
    return null;
  }

  return {
    id: row.id,
    github_id: row.github_id,
    repo: row.repo,
    number: row.number,
    title: row.title,
    html_url: row.html_url,
    state,
    merged: row.merged,
    draft: row.draft,
    review_decision: asReviewDecision(row.review_decision),
    issue_comments: row.issue_comments,
    review_comments: row.review_comments,
    github_updated_at: row.github_updated_at,
    github_created_at: row.github_created_at,
    closed_at: row.closed_at,
    merged_at: row.merged_at,
    synced_at: row.synced_at,
  };
}

export async function getGithubPrs(): Promise<GithubPr[]> {
  "use cache";
  cacheTag("github-prs");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("github_pull_requests")
      .select(PR_COLUMNS)
      .order("github_updated_at", { ascending: false })
      .limit(100);

    if (error || !data) {
      return [];
    }

    return data.flatMap((row) => {
      const mapped = mapGithubPr(row);
      return mapped ? [mapped] : [];
    });
  } catch {
    return [];
  }
}
