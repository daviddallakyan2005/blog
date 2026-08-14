import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  basePath,
}: {
  page: number;
  totalPages: number;
  basePath: string;
}) {
  if (totalPages <= 1) {
    return null;
  }

  function href(target: number) {
    return target <= 1 ? basePath : `${basePath}?page=${target}`;
  }

  return (
    <nav
      className="mt-12 flex items-center justify-between text-sm"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={href(page - 1)}
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
          href={href(page + 1)}
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
