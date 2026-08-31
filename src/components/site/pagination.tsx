import Link from "next/link";

import { articlesHref } from "@/lib/articles/filter-articles";

export function Pagination({
  page,
  totalPages,
  q,
  tag,
}: {
  page: number;
  totalPages: number;
  q?: string | null;
  tag?: string | null;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="mt-12 flex items-center justify-between text-sm"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={articlesHref({ q, tag, page: page - 1 })}
          className="text-accent underline-offset-4 hover:underline"
        >
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={articlesHref({ q, tag, page: page + 1 })}
          className="text-accent underline-offset-4 hover:underline"
        >
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
