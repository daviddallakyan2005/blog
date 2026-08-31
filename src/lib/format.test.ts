import { describe, expect, it } from "vitest";

import { formatCount, formatTimelineRange } from "./format";

describe("formatCount", () => {
  it("formats zero views", () => {
    expect(formatCount(0, "view")).toBe("0 views");
  });

  it("formats a single view", () => {
    expect(formatCount(1, "view")).toBe("1 view");
  });

  it("formats multiple views", () => {
    expect(formatCount(12, "view")).toBe("12 views");
  });

  it("formats a single like", () => {
    expect(formatCount(1, "like")).toBe("1 like");
  });

  it("formats multiple likes", () => {
    expect(formatCount(2, "like")).toBe("2 likes");
  });

  it("treats negative and non-finite counts as zero", () => {
    expect(formatCount(-3, "view")).toBe("0 views");
    expect(formatCount(Number.NaN, "like")).toBe("0 likes");
    expect(formatCount(Number.POSITIVE_INFINITY, "view")).toBe("0 views");
  });
});

describe("formatTimelineRange", () => {
  it("shows one month when start and end format the same", () => {
    expect(
      formatTimelineRange({
        start_date: "2025-03-20",
        end_date: "2025-03-20",
        is_current: false,
      }),
    ).toBe("Mar 2025");
  });

  it("shows a range when the months differ", () => {
    expect(
      formatTimelineRange({
        start_date: "2024-01-01",
        end_date: "2025-03-20",
        is_current: false,
      }),
    ).toBe("Jan 2024 – Mar 2025");
  });

  it("uses Present for a current role", () => {
    expect(
      formatTimelineRange({
        start_date: "2025-01-01",
        end_date: null,
        is_current: true,
      }),
    ).toBe("Jan 2025 – Present");
  });

  it("uses only the published date for press", () => {
    expect(
      formatTimelineRange({
        kind: "press",
        start_date: "2025-03-20",
        end_date: "2025-06-01",
        is_current: true,
      }),
    ).toBe("Mar 2025");
  });
});
