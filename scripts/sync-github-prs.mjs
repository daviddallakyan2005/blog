#!/usr/bin/env node
/**
 * Hourly GitHub PR sync for a trusted machine / GitHub Action.
 *
 *   node --env-file=.env.local scripts/sync-github-prs.mjs
 *   node scripts/sync-github-prs.mjs
 *
 * GraphQL fetch + map is duplicated here because this file is .mjs and the
 * unit-tested mapper lives in src/lib/github/pull-requests.ts (used by the
 * Studio Server Action). Field names must stay identical. Do not add tsx.
 *
 * Does not call updateTag (not a Next.js runtime). Public cache uses cacheLife.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

const DEFAULT_GITHUB_PR_AUTHOR = "daviddallakyan2005";
const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const REVIEW_DECISIONS = new Set([
  "APPROVED",
  "CHANGES_REQUESTED",
  "REVIEW_REQUIRED",
]);

const SEARCH_QUERY = `
  query PublicPullRequests($query: String!, $first: Int!) {
    search(query: $query, type: ISSUE, first: $first) {
      nodes {
        ... on PullRequest {
          databaseId
          number
          title
          url
          isDraft
          state
          merged
          reviewDecision
          createdAt
          updatedAt
          closedAt
          mergedAt
          comments { totalCount }
          reviewThreads { totalCount }
          repository { nameWithOwner isPrivate }
        }
      }
    }
  }
`;

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }

  return true;
}

function loadEnv() {
  const root = process.cwd();
  loadEnvFile(resolve(root, ".env.local"));
  loadEnvFile(resolve(root, ".env"));
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing ${name}. Set it in .env.local (or GitHub Actions secrets) and retry.`,
    );
    process.exit(1);
  }
  return value;
}

function isoOrNull(value) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function countOrZero(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function mapReviewDecision(value) {
  return REVIEW_DECISIONS.has(value) ? value : null;
}

function mapState(value) {
  if (typeof value !== "string") {
    return null;
  }
  const lowered = value.toLowerCase();
  if (lowered === "open") {
    return "open";
  }
  if (lowered === "closed" || lowered === "merged") {
    return "closed";
  }
  return null;
}

function mapGithubPullRequest(node) {
  if (!node) {
    return null;
  }

  const githubId = node.databaseId;
  const repo = node.repository?.nameWithOwner;
  const number = node.number;
  const title = node.title;
  const url = node.url;
  const githubCreatedAt = isoOrNull(node.createdAt);
  const githubUpdatedAt = isoOrNull(node.updatedAt);

  if (
    githubId == null ||
    !repo ||
    number == null ||
    !url ||
    !title ||
    !githubCreatedAt ||
    !githubUpdatedAt ||
    node.repository?.isPrivate === true
  ) {
    return null;
  }

  const state = mapState(node.state);
  if (!state) {
    return null;
  }

  return {
    github_id: githubId,
    repo,
    number,
    title,
    html_url: url,
    state,
    merged: Boolean(node.merged),
    draft: Boolean(node.isDraft),
    review_decision: mapReviewDecision(node.reviewDecision),
    issue_comments: countOrZero(node.comments?.totalCount),
    review_comments: countOrZero(node.reviewThreads?.totalCount),
    github_created_at: githubCreatedAt,
    github_updated_at: githubUpdatedAt,
    closed_at: isoOrNull(node.closedAt),
    merged_at: isoOrNull(node.mergedAt),
  };
}

async function fetchPublicPullRequests({ token, author, first = 100 }) {
  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "blog-github-pr-sync",
    },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: {
        query: `is:pr is:public author:${author} sort:updated`,
        first,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("GitHub GraphQL request failed.");
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("GitHub GraphQL request failed.");
  }

  if (payload.errors) {
    throw new Error("GitHub GraphQL request failed.");
  }

  const nodes = payload.data?.search?.nodes;
  if (!nodes) {
    throw new Error("GitHub GraphQL request failed.");
  }

  const rows = [];
  for (const node of nodes) {
    const mapped = mapGithubPullRequest(node);
    if (mapped) {
      rows.push(mapped);
    }
  }
  return rows;
}

loadEnv();

const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const token = requireEnv("GITHUB_PR_TOKEN");
const author = process.env.GITHUB_PR_AUTHOR?.trim() || DEFAULT_GITHUB_PR_AUTHOR;

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let rows;
try {
  rows = await fetchPublicPullRequests({ token, author });
} catch (error) {
  const message = error instanceof Error ? error.message : "Sync failed.";
  console.error(message);
  process.exit(1);
}

const syncedAt = new Date().toISOString();
const payload = rows.map((row) => ({ ...row, synced_at: syncedAt }));

if (payload.length > 0) {
  const { error } = await supabase
    .from("github_pull_requests")
    .upsert(payload, { onConflict: "github_id" });

  if (error) {
    console.error("Could not save pull requests.");
    process.exit(1);
  }
}

console.log(`Synced ${payload.length} pull requests.`);
