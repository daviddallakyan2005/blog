"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type NavItem = {
  href: string;
  label: string;
};

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button
          ref={triggerRef}
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X /> : <Menu />}
        </Button>
      </DialogTrigger>
      <DialogPortal>
        {open ? (
          <div
            data-slot="mobile-nav-overlay"
            className="fixed inset-[3.5rem_0_0_0] z-30 bg-black/50 animate-[fade-in_150ms_ease-out]"
            onClick={() => setOpen(false)}
          />
        ) : null}
        <DialogPrimitive.Content
          data-slot="mobile-nav-panel"
          className="fixed top-14 right-6 z-30 w-56 max-w-[calc(100vw-1.5rem)] origin-top-right rounded-lg border border-border bg-background shadow-md data-[state=closed]:animate-[slide-up-nav_200ms_ease-in] data-[state=open]:animate-[slide-down-nav_200ms_ease-out]"
          onPointerDownOutside={(event) => {
            const target = event.detail.originalEvent.target as Node | null;
            if (target && triggerRef.current?.contains(target)) {
              event.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">Menu</DialogTitle>
          <nav aria-label="Site" className="px-3 py-2">
            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.href}>
                  <DialogClose asChild>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center rounded-md px-3 text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  </DialogClose>
                </li>
              ))}
            </ul>
          </nav>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
