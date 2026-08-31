"use client";

import { ChevronDown } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

export function CvDisclosure({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function syncFromHash() {
      if (window.location.hash === "#cv") {
        setOpen(true);
      }
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const retries = [0, 200, 800, 2000].map((ms) =>
      window.setTimeout(syncFromHash, ms),
    );

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      for (const id of retries) {
        window.clearTimeout(id);
      }
    };
  }, []);

  return (
    <details
      id="cv"
      className="group mt-8 scroll-mt-20"
      open={open}
      onToggle={(event) => {
        setOpen(event.currentTarget.open);
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none size-3.5 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
        />
        CV
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}
