"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appendTypedKey, matchesUnlockPhrase } from "@/lib/play/typed-phrase";

const PlayHub = dynamic(
  () => import("@/components/play/play-hub").then((m) => m.PlayHub),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Opening the hidden menu…
        </p>
      </div>
    ),
  },
);

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  if (target.isContentEditable) return true;

  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select";
}

function isExcludedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/studio") ||
    pathname === "/login" ||
    pathname === "/denied" ||
    pathname.startsWith("/auth")
  );
}

export function EasterEggProvider() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const bufferRef = useRef("");

  const enabled = !isExcludedPath(pathname);

  if (!enabled && open) {
    setOpen(false);
  }

  useEffect(() => {
    bufferRef.current = "";
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (open) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1) return;
      if (isEditableElement(event.target)) return;

      const nextBuffer = appendTypedKey(bufferRef.current, event.key);
      bufferRef.current = nextBuffer;

      if (matchesUnlockPhrase(nextBuffer)) {
        bufferRef.current = "";
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, open]);

  return (
    <Dialog open={enabled && open} onOpenChange={setOpen}>
      <DialogContent className="flex flex-col sm:max-w-5xl max-h-[90dvh] overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>Take a break</DialogTitle>
          <DialogDescription>
            Hidden menu unlocked. Pick a game and decompress for a minute.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto">
          {enabled && open ? <PlayHub /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
