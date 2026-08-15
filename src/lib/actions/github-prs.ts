"use server";

import { updateTag } from "next/cache";

import { requireOwner } from "@/lib/auth";
import {
  DEFAULT_GITHUB_PR_AUTHOR,
  fetchPublicPullRequests,
} from "@/lib/github/pull-requests";
import { createClient } from "@/lib/supabase/server";

type ActionOk<T extends object = object> = {
  success: true;
} & T;

type ActionErr = {
  success: false;
  error: string;
};

export type ActionResult<T extends object = object> = ActionOk<T> | ActionErr;

function fail(error: string): ActionErr {
  return { success: false, error };
}

export async function syncGithubPullRequests(): Promise<
  ActionResult<{ count: number }>
> {
  await requireOwner();

  const token = process.env.GITHUB_PR_TOKEN?.trim();
  if (!token) {
    return fail("GitHub token is not configured.");
  }

  const author =
    process.env.GITHUB_PR_AUTHOR?.trim() || DEFAULT_GITHUB_PR_AUTHOR;

  let rows;
  try {
    rows = await fetchPublicPullRequests({ token, author });
  } catch {
    return fail("Could not fetch pull requests from GitHub.");
  }

  const supabase = await createClient();
  const syncedAt = new Date().toISOString();
  const payload = rows.map((row) => ({ ...row, synced_at: syncedAt }));

  if (payload.length > 0) {
    const { error } = await supabase
      .from("github_pull_requests")
      .upsert(payload, { onConflict: "github_id" });

    if (error) {
      return fail("Could not save pull requests.");
    }
  }

  updateTag("github-prs");
  return { success: true, count: payload.length };
}
