import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchPosts, type SearchResult } from "@/lib/data/search";
import { publicPageMetadata } from "@/lib/seo/metadata";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const meta = publicPageMetadata({
    title: "Search",
    description: "Search published articles.",
    path: "/search",
  });

  if (q?.trim()) {
    return {
      ...meta,
      robots: { index: false, follow: true },
    };
  }

  return meta;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <div className="mx-auto max-w-prose px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <p className="mt-3 text-muted-foreground">
        Find published articles.
      </p>
      <Suspense fallback={<SearchForm q="" />}>
        <SearchFormFromParams searchParams={searchParams} />
      </Suspense>
      <Suspense
        fallback={
          <p className="mt-10 text-sm text-muted-foreground">Searching…</p>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function SearchForm({ q = "" }: { q?: string }) {
  return (
    <form action="/search" method="get" className="mt-8 flex gap-2">
      <Input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search posts…"
        aria-label="Search"
        className="flex-1"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}

async function SearchFormFromParams({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  return <SearchForm q={raw ?? ""} />;
}

async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: raw } = await searchParams;
  const q = raw ?? "";
  const results = await searchPosts(q);
  return <ResultsList q={q} results={results} />;
}

function postHref(result: SearchResult): string {
  return `/articles/${result.slug}`;
}

function snippetHtml(snippet: string): string {
  return snippet
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;b&gt;/gi, "<mark>")
    .replace(/&lt;\/b&gt;/gi, "</mark>");
}

function ResultsList({ q, results }: { q: string; results: SearchResult[] }) {
  if (!q.trim()) {
    return (
      <p className="mt-10 text-muted-foreground">
        Enter a search term to find posts.
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className="mt-10 text-muted-foreground">
        No published posts matched “{q.trim()}”.
      </p>
    );
  }

  return (
    <ol className="mt-10 space-y-8">
      {results.map((result) => (
        <li key={result.slug}>
          <Link
            href={postHref(result)}
            className="text-lg font-medium tracking-tight hover:text-accent"
          >
            {result.title}
          </Link>
          {result.snippet ? (
            <p
              className="mt-2 text-sm text-muted-foreground [&_mark]:bg-accent/20 [&_mark]:text-foreground"
              dangerouslySetInnerHTML={{ __html: snippetHtml(result.snippet) }}
            />
          ) : null}
        </li>
      ))}
    </ol>
  );
}
