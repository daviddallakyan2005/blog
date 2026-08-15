import { describe, expect, it } from "vitest";

import {
  mapGithubPullRequest,
  type GithubPullRequestNode,
} from "./pull-requests";

function baseNode(
  overrides: Partial<GithubPullRequestNode> = {},
): GithubPullRequestNode {
  return {
    databaseId: 42,
    number: 7,
    title: "Add feature",
    url: "https://github.com/acme/app/pull/7",
    isDraft: false,
    state: "OPEN",
    merged: false,
    reviewDecision: "REVIEW_REQUIRED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    closedAt: null,
    mergedAt: null,
    comments: { totalCount: 3 },
    reviewThreads: { totalCount: 1 },
    repository: { nameWithOwner: "acme/app", isPrivate: false },
    ...overrides,
  };
}

describe("mapGithubPullRequest", () => {
  it("returns null for a private repository", () => {
    expect(
      mapGithubPullRequest(
        baseNode({
          repository: { nameWithOwner: "acme/secret", isPrivate: true },
        }),
      ),
    ).toBeNull();
  });

  it("maps GraphQL MERGED state to closed with merged true", () => {
    const row = mapGithubPullRequest(
      baseNode({
        state: "MERGED",
        merged: true,
      }),
    );

    expect(row).not.toBeNull();
    expect(row).toMatchObject({ state: "closed", merged: true });
  });

  it("maps a merged closed pull request", () => {
    const row = mapGithubPullRequest(
      baseNode({
        state: "CLOSED",
        merged: true,
        closedAt: "2026-01-03T00:00:00Z",
        mergedAt: "2026-01-03T00:00:00Z",
        reviewDecision: "APPROVED",
      }),
    );

    expect(row).toMatchObject({
      github_id: 42,
      repo: "acme/app",
      number: 7,
      state: "closed",
      merged: true,
      draft: false,
      review_decision: "APPROVED",
      closed_at: "2026-01-03T00:00:00Z",
      merged_at: "2026-01-03T00:00:00Z",
    });
  });

  it("maps an open pull request with CHANGES_REQUESTED", () => {
    const row = mapGithubPullRequest(
      baseNode({
        state: "OPEN",
        merged: false,
        reviewDecision: "CHANGES_REQUESTED",
      }),
    );

    expect(row).toMatchObject({
      state: "open",
      merged: false,
      review_decision: "CHANGES_REQUESTED",
      issue_comments: 3,
      review_comments: 1,
      html_url: "https://github.com/acme/app/pull/7",
    });
  });

  it("returns null when databaseId is missing", () => {
    expect(mapGithubPullRequest(baseNode({ databaseId: null }))).toBeNull();
  });

  it("sets review_decision to null when absent", () => {
    const row = mapGithubPullRequest(baseNode({ reviewDecision: null }));

    expect(row).not.toBeNull();
    expect(row?.review_decision).toBeNull();
  });
});
