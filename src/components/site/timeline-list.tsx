import { RenderedHtml } from "@/components/prose/rendered-html";
import type { TimelineEntry, TimelineKind } from "@/lib/data/types";
import { formatDateOnly } from "@/lib/format";

const KIND_ORDER: TimelineKind[] = [
  "role",
  "education",
  "talk",
  "award",
  "oss_contribution",
];

const KIND_LABELS: Record<TimelineKind, string> = {
  role: "Experience",
  education: "Education",
  talk: "Talks",
  award: "Awards",
  oss_contribution: "Open source",
};

function dateRange(entry: TimelineEntry): string | null {
  const start = formatDateOnly(entry.start_date);
  const end = entry.is_current ? "Present" : formatDateOnly(entry.end_date);
  if (start && end) {
    return `${start} – ${end}`;
  }
  return start ?? end;
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const range = dateRange(entry);

  return (
    <article className="border-b border-border/80 py-6 last:border-b-0">
      <h3 className="font-semibold tracking-tight">{entry.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {entry.org_url && entry.org ? (
          <a
            href={entry.org_url}
            target="_blank"
            rel="noreferrer"
            className="text-accent underline-offset-4 hover:underline"
          >
            {entry.org}
          </a>
        ) : (
          entry.org
        )}
        {entry.org && range ? <span aria-hidden="true"> · </span> : null}
        {range ? <span>{range}</span> : null}
      </p>
      {entry.description_html.trim() ? (
        <div className="mt-3">
          <RenderedHtml html={entry.description_html} />
        </div>
      ) : null}
      {entry.highlights.length > 0 ? (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {entry.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) {
    return null;
  }

  const grouped = KIND_ORDER.flatMap((kind) => {
    const items = entries.filter((entry) => entry.kind === kind);
    if (items.length === 0) {
      return [];
    }
    return [{ kind, label: KIND_LABELS[kind], items }];
  });

  return (
    <div className="mt-16 space-y-12">
      {grouped.map((group) => (
        <section key={group.kind} aria-labelledby={`timeline-${group.kind}`}>
          <h2
            id={`timeline-${group.kind}`}
            className="text-xl font-semibold tracking-tight"
          >
            {group.label}
          </h2>
          <div className="mt-2">
            {group.items.map((entry) => (
              <TimelineItem key={entry.id} entry={entry} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
