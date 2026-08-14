import { describe, expect, it } from "vitest";

import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and kebab-cases", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Café résumé")).toBe("cafe-resume");
  });

  it("trims edge hyphens", () => {
    expect(slugify("  --Hello--  ")).toBe("hello");
  });

  it("caps length at 80", () => {
    expect(slugify("a".repeat(100)).length).toBe(80);
  });
});
