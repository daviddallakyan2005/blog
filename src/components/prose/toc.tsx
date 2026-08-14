import type { TocItem } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export function Toc({ items }: { items: TocItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Table of contents">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        On this page
      </p>
      <ol className="mt-3 space-y-2 text-sm">
        {items.map((item) => (
          <li
            key={`${item.id}-${item.text}`}
            className={cn(item.level >= 3 && "pl-3", item.level >= 4 && "pl-6")}
          >
            <a
              href={`#${item.id}`}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
