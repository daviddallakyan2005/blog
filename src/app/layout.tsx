import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";

import {
  JsonLd,
  personJsonLd,
  pressSameAsUrls,
  websiteJsonLd,
} from "@/components/seo/json-ld";
import { getSiteSettings } from "@/lib/data/settings";
import { getTimelineEntries } from "@/lib/data/timeline";
import type { SiteSocial } from "@/lib/data/types";
import {
  AUTHOR_NAME,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: AUTHOR_NAME, url: SITE_URL }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}})();`;

function socialProfileUrls(social: SiteSocial | undefined): string[] {
  if (!social) {
    return [];
  }

  return [social.twitter, social.linkedin].filter(
    (value): value is string =>
      typeof value === "string" && /^https?:\/\//i.test(value),
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, timeline] = await Promise.all([
    getSiteSettings(),
    getTimelineEntries(),
  ]);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <JsonLd
          data={[
            personJsonLd([
              ...socialProfileUrls(settings?.social),
              ...pressSameAsUrls(timeline),
            ]),
            websiteJsonLd(),
          ]}
        />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
