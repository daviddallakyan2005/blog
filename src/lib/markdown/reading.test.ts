import { describe, expect, it } from "vitest";

import { readingStats } from "./reading";

describe("readingStats", () => {
  it("counts words and ceils minutes", () => {
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
    const stats = readingStats(words);

    expect(stats.words).toBe(300);
    expect(stats.minutes).toBe(Math.ceil(300 / 200));
    expect(Number.isInteger(stats.minutes)).toBe(true);
  });

  it("returns zeros for empty input", () => {
    expect(readingStats("")).toEqual({ minutes: 0, words: 0 });
  });

  it("never returns a fractional minute", () => {
    const stats = readingStats("just a few words");
    expect(stats.minutes).toBe(Math.ceil(stats.minutes));
    expect(stats.words).toBeGreaterThan(0);
  });
});
