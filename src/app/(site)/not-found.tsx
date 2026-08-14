import Link from "next/link";

export default function SiteNotFound() {
  return (
    <div className="mx-auto max-w-prose px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-muted-foreground">
        That page does not exist or is not published.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-accent underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </div>
  );
}
