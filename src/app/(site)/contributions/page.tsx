import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { getGithubPrs } from "@/lib/data/github-prs";
import type { GithubPr } from "@/lib/data/types";

export const metadata: Metadata = {
  title: "Contributions",
  description: "Public pull requests on GitHub.",
};

function displayState(pr: GithubPr): string {
  if (pr.state === "open") {
    return "Open";
  }
  return pr.merged ? "Merged" : "Closed";
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
  const parts = [`${pr.repo} #${pr.number}`, displayState(pr)];
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

export default async function ContributionsPage() {
  const prs = await getGithubPrs();

  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Contributions</h1>
      <p className="mt-3 text-muted-foreground">
        Public pull requests on GitHub.
      </p>

      {prs.length === 0 ? (
        <p className="mt-10 text-muted-foreground">
          No public pull requests synced yet.
        </p>
      ) : (
        <ul className="mt-10">
          {prs.map((pr) => (
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
          ))}
        </ul>
      )}
    </div>
  );
}
