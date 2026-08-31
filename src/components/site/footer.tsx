import { cacheLife } from "next/cache";
import Link from "next/link";

import { getSiteChrome } from "@/lib/data/settings";
import { AUTHOR_NAME } from "@/lib/seo/site";

async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const [year, chrome] = await Promise.all([copyrightYear(), getSiteChrome()]);
  const name = chrome?.display_name?.trim() || AUTHOR_NAME;

  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-prose items-center justify-between px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {year} {name}
        </p>
        <Link href="/studio" className="underline-offset-4 hover:underline">
          Studio
        </Link>
      </div>
    </footer>
  );
}
