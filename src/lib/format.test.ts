import { describe, expect, it } from "vitest";

import { formatCount } from "./format";

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
