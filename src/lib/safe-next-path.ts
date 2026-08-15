const INVALID = "/";

function isSafeRelativePath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

/**
 * Same-origin relative path for OAuth `next`. Invalid values return `/`
 * so a poisoned query cannot send readers to `/denied` or off-site.
 */
export function safeNextPath(
  next: string | null | undefined,
  origin: string,
): string {
  if (!next) {
    return INVALID;
  }

  if (
    !next.startsWith("/") ||
    next.startsWith("//") ||
    next.includes("\\")
  ) {
    return INVALID;
  }

  let url: URL;
  try {
    url = new URL(next, origin);
  } catch {
    return INVALID;
  }

  if (url.origin !== origin) {
    return INVALID;
  }

  const candidate = `${url.pathname}${url.search}`;
  if (!isSafeRelativePath(candidate)) {
    return INVALID;
  }

  let again: URL;
  try {
    again = new URL(candidate, origin);
  } catch {
    return INVALID;
  }

  if (again.origin !== origin) {
    return INVALID;
  }

  const result = `${again.pathname}${again.search}`;
  if (!isSafeRelativePath(result)) {
    return INVALID;
  }

  return result;
}
