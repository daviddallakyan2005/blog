"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function CopyCodeRoot({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) {
      return;
    }

    const cleanups: Array<() => void> = [];

    root.querySelectorAll("pre").forEach((pre) => {
      if (
        !(pre instanceof HTMLElement) ||
        pre.querySelector("[data-copy-code]")
      ) {
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.copyCode = "";
      button.textContent = "Copy";
      button.className =
        "absolute top-2 right-2 rounded-md border border-border bg-background/90 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground";

      const onClick = async () => {
        const text =
          pre.querySelector("code")?.textContent ?? pre.textContent ?? "";
        try {
          await navigator.clipboard.writeText(text);
          button.textContent = "Copied";
          window.setTimeout(() => {
            button.textContent = "Copy";
          }, 1500);
        } catch {
          button.textContent = "Failed";
        }
      };

      button.addEventListener("click", onClick);
      pre.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener("click", onClick);
        button.remove();
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
