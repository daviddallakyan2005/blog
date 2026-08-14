import { cacheLife } from "next/cache";

import { AUTHOR_NAME } from "@/lib/seo/site";

async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

export async function Footer() {
  const year = await copyrightYear();

  return (
    <footer className="mt-auto border-t border-border/80">
      <div className="mx-auto flex max-w-prose items-center justify-between px-6 py-8 text-sm text-muted-foreground">
        <p>
          © {year} {AUTHOR_NAME}
        </p>
      </div>
    </footer>
  );
}
