"use client";

import { useState } from "react";
import Link from "next/link";
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
  const [pending, setPending] = useState(false);

  async function signInWithGitHub() {
    if (pending) {
      return;
    }

    setPending(true);
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
      setPending(false);
      toast.error(error.message);
    }
  }

  return (
    <main className="w-full max-w-sm text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-3 text-muted-foreground">
        GitHub sign-in is required to comment or to open the studio. Non-owners
        who sign in from a public page return there.
      </p>
      <Button
        type="button"
        className="mt-8 w-full"
        onClick={signInWithGitHub}
        disabled={pending}
        aria-busy={pending}
      >
        <Github />
        {pending ? "Signing in…" : "Sign in with GitHub"}
      </Button>
      <Link
        href="/"
        className="mt-6 inline-block text-accent underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </main>
  );
}
