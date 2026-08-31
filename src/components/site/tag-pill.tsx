import Link from "next/link";

import { cn } from "@/lib/utils";

export function TagPill({
  name,
  slug,
  className,
}: {
  name: string;
  slug: string;
  className?: string;
}) {
  return (
    <Link
      href={`/articles?tag=${slug}`}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:text-foreground",
        className,
      )}
    >
      {name}
    </Link>
  );
}
