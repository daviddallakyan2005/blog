import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getSiteSettings } from "@/lib/data/settings";
import { SITE_NAME } from "@/lib/seo/site";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const siteName = settings?.display_name?.trim() || SITE_NAME;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header siteName={siteName} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
