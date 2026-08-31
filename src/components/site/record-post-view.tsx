"use client";

import { useEffect } from "react";

import { recordPostView } from "@/lib/actions/views";

export function RecordPostView({ postId }: { postId: string }) {
  useEffect(() => {
    if (typeof sessionStorage === "undefined") {
      return;
    }

    const key = `post-view:${postId}`;
    if (sessionStorage.getItem(key)) {
      return;
    }

    sessionStorage.setItem(key, "1");
    void recordPostView(postId).catch(() => undefined);
  }, [postId]);

  return null;
}
