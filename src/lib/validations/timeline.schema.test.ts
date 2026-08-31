import { describe, expect, it } from "vitest";

import { createTimelineSchema, timelineKindSchema } from "./timeline.schema";

const validPayload = {
  kind: "press" as const,
  title: "Empowering Journey in Computer Science",
  is_current: false,
  description_md: "",
  highlights: [] as string[],
  sort_order: 40,
};

describe("timelineKindSchema", () => {
  it("accepts press", () => {
    expect(timelineKindSchema.parse("press")).toBe("press");
  });

  it("rejects unknown kinds", () => {
    expect(timelineKindSchema.safeParse("podcast").success).toBe(false);
    expect(timelineKindSchema.safeParse("interview").success).toBe(false);
  });
});

describe("createTimelineSchema", () => {
  it("accepts kind press", () => {
    expect(createTimelineSchema.parse(validPayload).kind).toBe("press");
  });

  it("rejects unknown kinds", () => {
    expect(
      createTimelineSchema.safeParse({ ...validPayload, kind: "podcast" })
        .success,
    ).toBe(false);
  });

  it("stores press as a single date", () => {
    expect(
      createTimelineSchema.parse({
        ...validPayload,
        start_date: "2025-03-20",
        end_date: "2025-06-01",
        is_current: true,
      }),
    ).toEqual({
      ...validPayload,
      start_date: "2025-03-20",
      end_date: null,
      is_current: false,
    });
  });
});
