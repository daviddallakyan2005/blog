export const DEFAULT_GITHUB_PR_AUTHOR = "daviddallakyan2005";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const DEFAULT_FIRST = 100;

const REVIEW_DECISIONS = new Set([
  "APPROVED",
  "CHANGES_REQUESTED",
  "REVIEW_REQUIRED",
] as const);

export type GithubReviewDecision =
  "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED";

export type MappedGithubPullRequest = {
  github_id: number;
  repo: string;
  number: number;
  title: string;
  html_url: string;
  state: "open" | "closed";
  merged: boolean;
  draft: boolean;
  review_decision: GithubReviewDecision | null;
  issue_comments: number;
  review_comments: number;
  github_created_at: string;
  github_updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
};

export type GithubPullRequestNode = {
  databaseId?: number | null;
  number?: number | null;
  title?: string | null;
  url?: string | null;
  isDraft?: boolean | null;
  state?: string | null;
  merged?: boolean | null;
  reviewDecision?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  closedAt?: string | null;
  mergedAt?: string | null;
  comments?: { totalCount?: number | null } | null;
  reviewThreads?: { totalCount?: number | null } | null;
  repository?: {
    nameWithOwner?: string | null;
    isPrivate?: boolean | null;
  } | null;
};

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

function isoOrNull(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function countOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : 0;
}

function mapReviewDecision(
  value: string | null | undefined,
): GithubReviewDecision | null {
  if (value && REVIEW_DECISIONS.has(value as GithubReviewDecision)) {
    return value as GithubReviewDecision;
  }
  return null;
}

function mapState(value: string | null | undefined): "open" | "closed" | null {
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

export function mapGithubPullRequest(
  node: GithubPullRequestNode | null | undefined,
): MappedGithubPullRequest | null {
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

type FetchPublicPullRequestsOptions = {
  token: string;
  author: string;
  first?: number;
};

export async function fetchPublicPullRequests({
  token,
  author,
  first = DEFAULT_FIRST,
}: FetchPublicPullRequestsOptions): Promise<MappedGithubPullRequest[]> {
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

  let payload: {
    data?: {
      search?: {
        nodes?: Array<GithubPullRequestNode | null>;
      };
    };
    errors?: unknown;
  };

  try {
    payload = (await response.json()) as typeof payload;
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

  const rows: MappedGithubPullRequest[] = [];
  for (const node of nodes) {
    const mapped = mapGithubPullRequest(node);
    if (mapped) {
      rows.push(mapped);
    }
  }
  return rows;
}
