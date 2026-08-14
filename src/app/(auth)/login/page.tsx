"use client";

import { Github } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/browser";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/studio";
  }
  return next;
}

export default function LoginPage() {
  async function signInWithGitHub() {
    const supabase = createClient();
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo,
        scopes: "read:user user:email",
      },
    });

    if (error) {
      toast.error(error.message);
    }
  }

  return (
    <main className="w-full max-w-sm text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-muted-foreground">
        GitHub is required to access the studio.
      </p>
      <Button className="mt-8 w-full" onClick={signInWithGitHub}>
        <Github />
        Sign in with GitHub
      </Button>
    </main>
  );
}
