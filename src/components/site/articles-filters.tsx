import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { articlesHref } from "@/lib/articles/filter-articles";
import type { Tag } from "@/lib/data/types";
import { cn } from "@/lib/utils";

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

export function ArticlesFilters({
  q,
  tag,
  tags,
}: {
  q?: string | null;
  tag?: string | null;
  tags: Tag[];
}) {
  const activeTag = tag?.trim() || null;

  return (
    <div>
      <form action="/articles" method="get" className="mt-8 flex gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search articles…"
          aria-label="Search articles"
          className="flex-1"
        />
        {activeTag ? <input type="hidden" name="tag" value={activeTag} /> : null}
        <Button type="submit">Search</Button>
      </form>
      {tags.length > 0 ? (
        <nav
          aria-label="Filter by tag"
          className="mt-3 flex flex-wrap gap-x-1 gap-y-1"
        >
          <FilterLink href={articlesHref({ q, tag: null })} current={!activeTag}>
            All
          </FilterLink>
          {tags.map((item) => (
            <FilterLink
              key={item.slug}
              href={articlesHref({ q, tag: item.slug })}
              current={activeTag === item.slug}
            >
              {item.name}
            </FilterLink>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
