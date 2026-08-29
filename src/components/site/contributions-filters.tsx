import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "all", label: "All" },
  { value: "merged", label: "Merged" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
] as const;

type StatusValue = (typeof STATUSES)[number]["value"];

function normalizeStatus(status?: string | null): StatusValue {
  if (status === "merged" || status === "open" || status === "closed") {
    return status;
  }
  return "all";
}

function contributionsHref(
  basePath: string,
  status: string | null | undefined,
  repo: string | null | undefined,
): string {
  const params = new URLSearchParams();
  if (status && status !== "all") {
    params.set("status", status);
  }
  if (repo) {
    params.set("repo", repo);
  }
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

function FilterLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "rounded-md px-2 py-0.5 text-sm no-underline",
        current
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function ContributionsFilters({
  basePath,
  status,
  repo,
  repos,
  className,
}: {
  basePath: string;
  status?: string | null;
  repo?: string | null;
  repos: string[];
  className?: string;
}) {
  const activeStatus = normalizeStatus(status);
  const activeRepo = repo || null;

  return (
    <div className={cn("space-y-3", className)}>
      <nav
        aria-label="Filter by status"
        className="flex flex-wrap gap-x-1 gap-y-1"
      >
        {STATUSES.map((item) => (
          <FilterLink
            key={item.value}
            href={contributionsHref(basePath, item.value, activeRepo)}
            current={activeStatus === item.value}
          >
            {item.label}
          </FilterLink>
        ))}
      </nav>
      <nav
        aria-label="Filter by repository"
        className="flex flex-wrap gap-x-1 gap-y-1"
      >
        <FilterLink
          href={contributionsHref(basePath, activeStatus, null)}
          current={!activeRepo}
        >
          All repos
        </FilterLink>
        {repos.map((name) => (
          <FilterLink
            key={name}
            href={contributionsHref(basePath, activeStatus, name)}
            current={activeRepo === name}
          >
            {name}
          </FilterLink>
        ))}
      </nav>
    </div>
  );
}
