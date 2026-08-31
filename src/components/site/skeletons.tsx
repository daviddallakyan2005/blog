import type { ReactNode } from "react";

import { PostListSkeleton } from "@/components/site/post-list";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function LoadingStatus() {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      Loading
    </p>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <LoadingStatus />
      {children}
    </div>
  );
}

function TitleBlock() {
  return (
    <>
      <Skeleton className="h-9 w-40" />
      <Skeleton className="mt-3 h-5 w-64" />
    </>
  );
}

const PILL_WIDTHS = ["w-12", "w-16", "w-20", "w-14", "w-24", "w-10"] as const;

export function TagPillsSkeleton() {
  return (
    <ul className="mt-10 flex flex-wrap gap-2" aria-hidden="true">
      {PILL_WIDTHS.map((width) => (
        <li key={width}>
          <Skeleton className={cn("h-6 rounded-md", width)} />
        </li>
      ))}
    </ul>
  );
}

export function ProjectCardsSkeleton() {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-border p-6"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function PageListSkeleton() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <LoadingStatus />
      <div aria-hidden="true">
        <TitleBlock />
        <PostListSkeleton />
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <PageShell>
      <div aria-hidden="true">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-3 h-9 w-3/4" />
        <Skeleton className="mt-4 h-4 w-48" />
        <div className="mt-10 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </PageShell>
  );
}

export function HomeSkeleton() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <LoadingStatus />
      <div aria-hidden="true">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="mt-3 h-6 w-72" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="mt-16">
          <Skeleton className="h-6 w-16" />
          <div className="mt-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <Skeleton className="mt-10 h-9 w-36" />
        </div>
        <div className="mt-16">
          <Skeleton className="h-6 w-28" />
          <PostListSkeleton />
        </div>
        <div className="mt-16">
          <Skeleton className="h-6 w-24" />
          <PostListSkeleton />
        </div>
      </div>
    </div>
  );
}

export function AboutSkeleton() {
  return (
    <PageShell>
      <div aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="mt-3 h-6 w-72" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-16 space-y-6">
          <Skeleton className="h-6 w-32" />
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="space-y-2 border-b border-border/80 py-6 last:border-b-0"
            >
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function TagsSkeleton() {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <LoadingStatus />
      <div aria-hidden="true">
        <TitleBlock />
        <TagPillsSkeleton />
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <LoadingStatus />
      <div aria-hidden="true">
        <TitleBlock />
        <ProjectCardsSkeleton />
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <PageShell>
      <div aria-hidden="true">
        <TitleBlock />
        <div className="mt-8 flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="mt-10 space-y-8">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

export function ContributionsSkeleton() {
  return (
    <PageShell>
      <div aria-hidden="true">
        <TitleBlock />
        <ul className="mt-10">
          {Array.from({ length: 4 }, (_, index) => (
            <li
              key={index}
              className="space-y-2 border-b border-border/80 py-6 first:pt-0 last:border-b-0"
            >
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </li>
          ))}
        </ul>
      </div>
    </PageShell>
  );
}
