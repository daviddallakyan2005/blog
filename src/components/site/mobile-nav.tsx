"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type NavItem = {
  href: string;
  label: string;
};

export function MobileNav({ items }: { items: readonly NavItem[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Menu</DialogTitle>
        </DialogHeader>
        <nav aria-label="Site">
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
      </DialogContent>
    </Dialog>
  );
}
