import { cacheLife, cacheTag } from "next/cache";

import { createClient } from "@/lib/supabase/anon";

import type { TimelineEntry, TimelineKind } from "./types";

export type { TimelineEntry, TimelineKind } from "./types";

const TIMELINE_KINDS = new Set<TimelineKind>([
  "role",
  "education",
  "talk",
  "award",
  "oss_contribution",
]);

const TIMELINE_COLUMNS =
  "id, kind, title, org, org_url, start_date, end_date, is_current, description_html, highlights, sort_order";

function asKind(value: string): TimelineKind | null {
  return TIMELINE_KINDS.has(value as TimelineKind)
    ? (value as TimelineKind)
    : null;
}

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  "use cache";
  cacheTag("timeline");
  cacheLife("hours");

  const supabase = createClient();
  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("timeline_entries")
      .select(TIMELINE_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("start_date", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.flatMap((row) => {
      const kind = asKind(row.kind);
      if (!kind) {
        return [];
      }

      return [
        {
          id: row.id,
          kind,
          title: row.title,
          org: row.org,
          org_url: row.org_url,
          start_date: row.start_date,
          end_date: row.end_date,
          is_current: row.is_current,
          description_html: row.description_html,
          highlights: row.highlights ?? [],
          sort_order: row.sort_order,
        },
      ];
    });
  } catch {
    return [];
  }
}
