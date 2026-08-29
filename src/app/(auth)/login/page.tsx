"use client";

import { useState } from "react";
import Link from "next/link";
import { Github } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const [pending, setPending] = useState(false);

  async function signInWithGitHub() {
    if (pending) {
      return;
    }

    setPending(true);
    const supabase = createClient();
    const next = safeNextPath(
      new URLSearchParams(window.location.search).get("next") ?? "/studio",
      window.location.origin,
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
      <h1 className="text-2xl font-semibold tracking-tight">Studio</h1>
      <p className="mt-3 text-muted-foreground">
        Sign in with GitHub to open studio. Non-owners who arrived from a public
        page still return there.
      </p>
      <Button
        type="button"
        className="mt-8 w-full"
        onClick={signInWithGitHub}
        disabled={pending}
        aria-busy={pending}
      >
        <Github />
        {pending ? "Signing in…" : "Continue with GitHub"}
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
