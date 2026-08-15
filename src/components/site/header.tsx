import Link from "next/link";

import { MobileNav } from "@/components/site/mobile-nav";
import { ThemeToggle } from "@/components/site/theme-toggle";

const NAV = [
  { href: "/articles", label: "Articles" },
  { href: "/notes", label: "Notes" },
  { href: "/tags", label: "Tags" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/search", label: "Search" },
  { href: "/contributions", label: "Contributions" },
] as const;

export function Header({ siteName }: { siteName: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-prose items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="min-w-0 flex-1 truncate font-semibold tracking-tight md:flex-none"
        >
          {siteName}
        </Link>
        <nav
          className="hidden shrink-0 items-center gap-1 text-sm whitespace-nowrap md:flex"
          aria-label="Site"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-1.5 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
        <div className="flex shrink-0 items-center gap-1 md:hidden">
          <ThemeToggle />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
