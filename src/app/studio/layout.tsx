import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { requireOwner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Studio",
};

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const NAV = [
  { href: "/studio", label: "Dashboard" },
  { href: "/studio/posts", label: "Posts" },
  { href: "/studio/projects", label: "Projects" },
  { href: "/studio/timeline", label: "Timeline" },
  { href: "/studio/comments", label: "Comments" },
  { href: "/studio/settings", label: "Settings" },
] as const;

function StudioFallback() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-muted-foreground">
          Loading studio…
        </div>
      </header>
    </div>
  );
}

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<StudioFallback />}>
      <StudioShell>{children}</StudioShell>
    </Suspense>
  );
}

async function StudioShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireOwner();
  const name = profile.display_name || profile.github_username || "Owner";

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/studio" className="font-semibold tracking-tight">
              Studio
            </Link>
            <nav
              aria-label="Studio"
              className="flex flex-wrap items-center gap-4 text-sm"
            >
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-foreground hover:text-accent"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{name}</span>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
