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

export function formatReadingTime(minutes: number): string {
  const value = Math.max(1, minutes);
  return `${value} min read`;
}
