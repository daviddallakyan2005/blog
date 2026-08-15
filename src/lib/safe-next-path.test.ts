import { describe, expect, it } from "vitest";

import { safeNextPath } from "./safe-next-path";

const ORIGIN = "https://blog.example.com";

function expectAllowed(next: string, expected: string) {
  const result = safeNextPath(next, ORIGIN);
  expect(result).toBe(expected);
  expect(new URL(result, ORIGIN).origin).toBe(ORIGIN);
}

describe("safeNextPath", () => {
  it("keeps same-origin article and studio paths", () => {
    expectAllowed("/articles/x", "/articles/x");
    expectAllowed("/studio", "/studio");
    expectAllowed("/studio/posts", "/studio/posts");
  });

  it("keeps same-origin path with search", () => {
    expectAllowed("/search?q=rust", "/search?q=rust");
  });

  it("rejects protocol-relative and backslash open redirects", () => {
    expect(safeNextPath("//evil.com", ORIGIN)).toBe("/");
    expect(safeNextPath("/\\evil.com", ORIGIN)).toBe("/");
    expect(
      safeNextPath(
        new URLSearchParams("next=%2F%5C%5Cevil.com").get("next"),
        ORIGIN,
      ),
    ).toBe("/");
  });

  it("rejects missing and absolute URLs", () => {
    expect(safeNextPath(null, ORIGIN)).toBe("/");
    expect(safeNextPath("https://evil.com", ORIGIN)).toBe("/");
  });

  it("rejects pathnames that normalize to protocol-relative URLs", () => {
    expect(safeNextPath("/.//evil.com", ORIGIN)).toBe("/");
    expect(safeNextPath("/foo/..//evil.com", ORIGIN)).toBe("/");
    expect(safeNextPath("/%2e%2e//evil.com", ORIGIN)).toBe("/");
  });
});
