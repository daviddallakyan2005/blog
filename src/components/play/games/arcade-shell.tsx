"use client";

import type { ReactNode } from "react";

type ArcadeShellProps = {
  instructions: ReactNode;
  controls?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  wide?: boolean;
};

export function ArcadeShell({
  instructions,
  controls,
  actions,
  children,
  wide = false,
}: ArcadeShellProps) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{instructions}</p>
        {controls ? (
          <div className="text-xs text-muted-foreground">{controls}</div>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}

      <div
        className={
          wide
            ? "rounded-xl border bg-muted/20 p-3 overflow-auto"
            : "rounded-xl border bg-muted/20 p-3 flex justify-center overflow-auto"
        }
      >
        {children}
      </div>
    </div>
  );
}
