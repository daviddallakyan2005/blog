import { format } from "date-fns";

export function formatPostDate(iso: string | null | undefined): string | null {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return format(date, "MMMM d, yyyy");
}

export function formatDateOnly(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
    );
    return format(date, "MMM yyyy");
  }

  return formatPostDate(value);
}

export function formatTimelineRange(entry: {
  kind?: string;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
}): string | null {
  if (entry.kind === "press") {
    return formatDateOnly(entry.start_date);
  }

  const start = formatDateOnly(entry.start_date);
  const end = entry.is_current ? "Present" : formatDateOnly(entry.end_date);
  if (start && end && start !== end) {
    return `${start} – ${end}`;
  }
  return start ?? end;
}

export function formatReadingTime(minutes: number): string {
  const value = Math.max(1, minutes);
  return `${value} min read`;
}

export function formatCount(n: number, noun: "view" | "like"): string {
  const count = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  const label = count === 1 ? noun : `${noun}s`;
  return `${count} ${label}`;
}
