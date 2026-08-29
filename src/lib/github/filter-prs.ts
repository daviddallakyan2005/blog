export type FilterablePr = {
  merged: boolean;
  state: "open" | "closed";
  repo: string;
};

export type GithubPrFilter = {
  status?: string | null;
  repo?: string | null;
};

export function filterGithubPrs<
  T extends { merged: boolean; state: string; repo: string },
>(prs: T[], filter: GithubPrFilter): T[] {
  let result = prs;
  if (filter.status === "merged") {
    result = result.filter((pr) => pr.merged);
  } else if (filter.status === "open") {
    result = result.filter((pr) => pr.state === "open");
  } else if (filter.status === "closed") {
    result = result.filter((pr) => pr.state === "closed" && !pr.merged);
  }
  if (filter.repo) {
    result = result.filter((pr) => pr.repo === filter.repo);
  }
  return result;
}

export function uniqueRepos(prs: { repo: string }[]): string[] {
  return [...new Set(prs.map((pr) => pr.repo))].sort();
}
