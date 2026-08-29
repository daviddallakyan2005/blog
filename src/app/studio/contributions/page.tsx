import { formatDistanceToNow } from "date-fns";

import { ContributionsFilters } from "@/components/site/contributions-filters";
import { SyncGithubPrsButton } from "@/components/studio/sync-github-prs-button";
import { Badge } from "@/components/ui/badge";
import { requireOwner } from "@/lib/auth";
import { filterGithubPrs, uniqueRepos } from "@/lib/github/filter-prs";
import { createClient } from "@/lib/supabase/server";

function lastSyncedLabel(rows: { synced_at: string }[]): string {
  if (rows.length === 0) {
    return "Never";
  }

  const latest = rows.reduce((max, row) =>
    row.synced_at > max.synced_at ? row : max,
  ).synced_at;

  return formatDistanceToNow(new Date(latest), { addSuffix: true });
}

export default async function StudioContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; repo?: string }>;
}) {
  await requireOwner();
  const { status, repo } = await searchParams;
  const supabase = await createClient();

  const { data: pullRequests } = await supabase
    .from("github_pull_requests")
    .select(
      "id, title, repo, number, html_url, state, merged, draft, review_decision, issue_comments, review_comments, github_updated_at, synced_at",
    )
    .order("github_updated_at", { ascending: false })
    .limit(100);

  const list = pullRequests ?? [];
  const filtered = filterGithubPrs(list, { status, repo });
  const repos = uniqueRepos(list);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Contributions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length}{" "}
            {filtered.length === 1 ? "pull request" : "pull requests"} · Last
            synced {lastSyncedLabel(list)}
          </p>
        </div>
        <SyncGithubPrsButton />
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public pull requests synced yet. Use Sync now to pull them from
          GitHub.
        </p>
      ) : (
        <>
          <ContributionsFilters
            basePath="/studio/contributions"
            status={status}
            repo={repo}
            repos={repos}
          />
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pull requests match these filters.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Title</th>
                    <th className="px-4 py-2.5 font-medium">Repo</th>
                    <th className="px-4 py-2.5 font-medium">State</th>
                    <th className="px-4 py-2.5 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((pr) => (
                    <tr key={pr.id} className="hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <a
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium hover:text-accent"
                        >
                          {pr.title}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {pr.repo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge
                            variant={
                              pr.merged
                                ? "secondary"
                                : pr.state === "open"
                                  ? "default"
                                  : "outline"
                            }
                          >
                            {pr.merged
                              ? "Merged"
                              : pr.state === "open"
                                ? "Open"
                                : "Closed"}
                          </Badge>
                          {pr.draft ? (
                            <Badge variant="secondary">Draft</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDistanceToNow(new Date(pr.github_updated_at), {
                          addSuffix: true,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
