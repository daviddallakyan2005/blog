import type { Metadata } from "next";
import { Suspense } from "react";

import { ContributionsFilters } from "@/components/site/contributions-filters";
import { Badge } from "@/components/ui/badge";
import { getGithubPrs } from "@/lib/data/github-prs";
import type { GithubPr } from "@/lib/data/types";
import { filterGithubPrs, uniqueRepos } from "@/lib/github/filter-prs";

export const metadata: Metadata = {
  title: "Contributions",
  description: "Public pull requests on GitHub.",
};

function stateBadge(pr: GithubPr): {
  label: string;
  variant: "default" | "secondary" | "outline";
} {
  if (pr.merged) {
    return { label: "Merged", variant: "secondary" };
  }
  if (pr.state === "open") {
    return { label: "Open", variant: "default" };
  }
  return { label: "Closed", variant: "outline" };
}

function displayReview(decision: GithubPr["review_decision"]): string | null {
  switch (decision) {
    case "APPROVED":
      return "Approved";
    case "CHANGES_REQUESTED":
      return "Changes requested";
    case "REVIEW_REQUIRED":
      return "Review required";
    default:
      return null;
  }
}

function prMeta(pr: GithubPr): string {
  const parts = [`${pr.repo} #${pr.number}`];
  const review = displayReview(pr.review_decision);
  if (review) {
    parts.push(review);
  }
  const comments = pr.issue_comments + pr.review_comments;
  if (comments > 0) {
    parts.push(`${comments} comment${comments === 1 ? "" : "s"}`);
  }
  return parts.join(" · ");
}

export default function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; repo?: string }>;
}) {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contributions</h1>
      <p className="mt-3 text-muted-foreground">
        Public pull requests on GitHub.
      </p>
      <Suspense
        fallback={
          <p className="mt-10 text-muted-foreground">Loading pull requests…</p>
        }
      >
        <ContributionsList searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function ContributionsList({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; repo?: string }>;
}) {
  const { status, repo } = await searchParams;
  const prs = await getGithubPrs();
  const filtered = filterGithubPrs(prs, { status, repo });
  const repos = uniqueRepos(prs);

  if (prs.length === 0) {
    return (
      <p className="mt-10 text-muted-foreground">
        No public pull requests synced yet.
      </p>
    );
  }

  return (
    <>
      <ContributionsFilters
        className="mt-8"
        basePath="/contributions"
        status={status}
        repo={repo}
        repos={repos}
      />
      {filtered.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No pull requests match these filters.
        </p>
      ) : (
        <ul className="mt-10">
          {filtered.map((pr) => {
            const badge = stateBadge(pr);
            return (
              <li
                key={pr.id}
                className="border-b border-border/80 py-6 first:pt-0 last:border-b-0"
              >
                <h2 className="flex flex-wrap items-start gap-x-2 gap-y-1 text-lg font-semibold tracking-tight">
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="min-w-0 flex-1 break-words hover:text-accent"
                  >
                    {pr.title}
                  </a>
                  <Badge variant={badge.variant} className="mt-0.5 shrink-0">
                    {badge.label}
                  </Badge>
                  {pr.draft ? (
                    <Badge variant="secondary" className="mt-0.5 shrink-0">
                      Draft
                    </Badge>
                  ) : null}
                </h2>
                <p className="mt-1 break-words text-sm text-muted-foreground">
                  {prMeta(pr)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
