import type { ReactNode } from "react";

import { PostListSkeleton } from "@/components/site/post-list";
import { Skeleton } from "@/components/ui/skeleton";

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
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="mt-6 flex gap-4">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-12 space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>
        <Skeleton className="mt-8 h-5 w-10" />
        <div className="mt-16">
          <Skeleton className="h-6 w-24" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
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
