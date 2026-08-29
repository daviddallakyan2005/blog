import { describe, expect, it } from "vitest";

import { filterGithubPrs, uniqueRepos } from "./filter-prs";

const prs = [
  { merged: true, state: "closed" as const, repo: "acme/app" },
  { merged: false, state: "open" as const, repo: "acme/app" },
  { merged: false, state: "closed" as const, repo: "acme/other" },
];

describe("filterGithubPrs", () => {
  it("does not filter by status when omitted, all, or invalid", () => {
    expect(filterGithubPrs(prs, {})).toEqual(prs);
    expect(filterGithubPrs(prs, { status: "all" })).toEqual(prs);
    expect(filterGithubPrs(prs, { status: null })).toEqual(prs);
    expect(filterGithubPrs(prs, { status: "bogus" })).toEqual(prs);
  });

  it("keeps only merged pull requests when status is merged", () => {
    expect(filterGithubPrs(prs, { status: "merged" })).toEqual([
      { merged: true, state: "closed", repo: "acme/app" },
    ]);
  });

  it("keeps only open pull requests when status is open", () => {
    expect(filterGithubPrs(prs, { status: "open" })).toEqual([
      { merged: false, state: "open", repo: "acme/app" },
    ]);
  });

  it("keeps only unmerged closed pull requests when status is closed", () => {
    expect(filterGithubPrs(prs, { status: "closed" })).toEqual([
      { merged: false, state: "closed", repo: "acme/other" },
    ]);
  });

  it("filters by exact repo and ignores empty or missing repo", () => {
    expect(filterGithubPrs(prs, { repo: "acme/other" })).toEqual([
      { merged: false, state: "closed", repo: "acme/other" },
    ]);
    expect(filterGithubPrs(prs, { repo: "acme/app" })).toEqual([
      { merged: true, state: "closed", repo: "acme/app" },
      { merged: false, state: "open", repo: "acme/app" },
    ]);
    expect(filterGithubPrs(prs, {})).toEqual(prs);
    expect(filterGithubPrs(prs, { repo: null })).toEqual(prs);
    expect(filterGithubPrs(prs, { repo: "" })).toEqual(prs);
  });

  it("applies status and repo together as AND", () => {
    expect(
      filterGithubPrs(prs, { status: "merged", repo: "acme/app" }),
    ).toEqual([{ merged: true, state: "closed", repo: "acme/app" }]);
    expect(
      filterGithubPrs(prs, { status: "open", repo: "acme/other" }),
    ).toEqual([]);
    expect(
      filterGithubPrs(prs, { status: "closed", repo: "acme/other" }),
    ).toEqual([{ merged: false, state: "closed", repo: "acme/other" }]);
  });
});

describe("uniqueRepos", () => {
  it("returns sorted unique repo names", () => {
    expect(
      uniqueRepos([
        { repo: "zeta/app" },
        { repo: "acme/app" },
        { repo: "acme/app" },
        { repo: "acme/other" },
      ]),
    ).toEqual(["acme/app", "acme/other", "zeta/app"]);
  });
});
