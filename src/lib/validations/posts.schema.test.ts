import { describe, expect, it } from "vitest";

import { createPostSchema, slugSchema } from "./posts.schema";

describe("slugSchema", () => {
  it("accepts kebab-case", () => {
    expect(slugSchema.parse("hello-world")).toBe("hello-world");
  });

  it("rejects uppercase and spaces", () => {
    expect(slugSchema.safeParse("Hello World").success).toBe(false);
  });

  it("rejects empty", () => {
    expect(slugSchema.safeParse("").success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("requires a title and kind", () => {
    expect(
      createPostSchema.safeParse({ title: "Hi", kind: "article" }).success,
    ).toBe(true);
    expect(createPostSchema.safeParse({ title: " ", kind: "note" }).success).toBe(
      false,
    );
  });
});
