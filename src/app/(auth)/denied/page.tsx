import Link from "next/link";

export default function DeniedPage() {
  return (
    <main className="max-w-prose text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Access denied</h1>
      <p className="mt-3 text-muted-foreground">
        You are signed in, but this account is not the site owner.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block text-accent underline-offset-4 hover:underline"
      >
        Back home
      </Link>
    </main>
  );
}
