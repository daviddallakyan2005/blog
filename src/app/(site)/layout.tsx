import { EasterEggProvider } from "@/components/play/easter-egg-provider";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getSiteChrome } from "@/lib/data/settings";
import { SITE_NAME } from "@/lib/seo/site";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const chrome = await getSiteChrome();
  const siteName = chrome?.display_name?.trim() || SITE_NAME;

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground"
      >
        Skip to content
      </a>
      <div
        id="start-with-the-first-program"
        aria-hidden="true"
        data-easter-egg-hint="start with the first program"
        data-inspect-note="hidden hint box"
        className="pointer-events-none fixed -left-[10000px] top-0 opacity-0"
      >
        <div className="rounded-md border border-dashed border-muted-foreground/50 bg-background px-3 py-2 font-mono text-xs text-foreground shadow-sm">
          start with the first program
        </div>
      </div>
      <Header siteName={siteName} />
      <main id="content" className="flex-1">
        {children}
      </main>
      <Footer />
      <EasterEggProvider />
    </div>
  );
}
