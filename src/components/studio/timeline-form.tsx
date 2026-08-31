"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  createTimelineEntry,
  deleteTimelineEntry,
  updateTimelineEntry,
} from "@/lib/actions/timeline";
import type { Tables } from "@/lib/database.types";
import type { TimelineKind } from "@/lib/validations/timeline.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const selectClassName =
  "flex h-9 w-full rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

function asKind(value: string): TimelineKind {
  if (
    value === "education" ||
    value === "talk" ||
    value === "award" ||
    value === "oss_contribution" ||
    value === "press"
  ) {
    return value;
  }
  return "role";
}

export function TimelineForm({
  entry,
}: {
  entry?: Tables<"timeline_entries">;
}) {
  const router = useRouter();
  const [kind, setKind] = useState<TimelineKind>(
    entry ? asKind(entry.kind) : "role",
  );
  const [title, setTitle] = useState(entry?.title ?? "");
  const [org, setOrg] = useState(entry?.org ?? "");
  const [orgUrl, setOrgUrl] = useState(entry?.org_url ?? "");
  const [startDate, setStartDate] = useState(entry?.start_date ?? "");
  const [endDate, setEndDate] = useState(entry?.end_date ?? "");
  const [isCurrent, setIsCurrent] = useState(entry?.is_current ?? false);
  const [descriptionMd, setDescriptionMd] = useState(
    entry?.description_md ?? "",
  );
  const [highlights, setHighlights] = useState(
    (entry?.highlights ?? []).join("\n"),
  );
  const [sortOrder, setSortOrder] = useState(String(entry?.sort_order ?? 0));
  const [pending, setPending] = useState(false);

  const payload = {
    kind,
    title,
    org,
    org_url: orgUrl,
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent,
    description_md: descriptionMd,
    highlights: highlights
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    sort_order: Number.parseInt(sortOrder, 10) || 0,
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const result = entry
      ? await updateTimelineEntry({ id: entry.id, ...payload })
      : await createTimelineEntry(payload);
    setPending(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(entry ? "Entry saved" : "Entry created");
    if (entry) {
      router.refresh();
      return;
    }
    router.push("/studio/timeline");
  }

  async function onDelete() {
    if (!entry || !window.confirm(`Delete “${entry.title}”?`)) {
      return;
    }
    setPending(true);
    const result = await deleteTimelineEntry(entry.id);
    if (!result.success) {
      toast.error(result.error);
      setPending(false);
      return;
    }
    router.push("/studio/timeline");
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="timeline-title">Title</Label>
          <Input
            id="timeline-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timeline-kind">Kind</Label>
          <select
            id="timeline-kind"
            aria-label="Kind"
            value={kind}
            onChange={(event) => setKind(event.target.value as TimelineKind)}
            className={selectClassName}
          >
            <option value="role">Role</option>
            <option value="education">Education</option>
            <option value="talk">Talk</option>
            <option value="award">Award</option>
            <option value="oss_contribution">Open source</option>
            <option value="press">Elsewhere</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="timeline-org">Organization</Label>
          <Input
            id="timeline-org"
            value={org}
            onChange={(event) => setOrg(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timeline-org-url">Organization URL</Label>
          <Input
            id="timeline-org-url"
            type="url"
            value={orgUrl}
            onChange={(event) => setOrgUrl(event.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="timeline-start">Start date</Label>
          <Input
            id="timeline-start"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timeline-end">End date</Label>
          <Input
            id="timeline-end"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            disabled={isCurrent}
          />
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(event) => setIsCurrent(event.target.checked)}
          />
          Current
        </label>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timeline-description">Description (markdown)</Label>
        <Textarea
          id="timeline-description"
          value={descriptionMd}
          onChange={(event) => setDescriptionMd(event.target.value)}
          className="min-h-32 font-mono text-[13px]"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timeline-highlights">Highlights (one per line)</Label>
        <Textarea
          id="timeline-highlights"
          value={highlights}
          onChange={(event) => setHighlights(event.target.value)}
          className="min-h-24"
        />
      </div>
      <div className="grid max-w-40 gap-2">
        <Label htmlFor="timeline-sort">Sort order</Label>
        <Input
          id="timeline-sort"
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending || title.trim() === ""}>
          {pending ? "Saving…" : entry ? "Save" : "Create entry"}
        </Button>
        {entry ? (
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={onDelete}
          >
            Delete
          </Button>
        ) : null}
      </div>
    </form>
  );
}
