"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { syncGithubPullRequests } from "@/lib/actions/github-prs";
import { Button } from "@/components/ui/button";

export function SyncGithubPrsButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onSync() {
    if (pending) {
      return;
    }

    startTransition(async () => {
      const result = await syncGithubPullRequests();
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Synced ${result.count} ${result.count === 1 ? "pull request" : "pull requests"}`,
      );
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={onSync}
    >
      {pending ? "Syncing…" : "Sync now"}
    </Button>
  );
}
