import { describe, expect, it } from "vitest";

import { postIdSchema } from "./engagement.schema";

const postId = "11111111-1111-4111-8111-111111111111";

describe("postIdSchema", () => {
  it("rejects a missing postId", () => {
    expect(postIdSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid postId", () => {
    expect(postIdSchema.safeParse({ postId: "not-a-uuid" }).success).toBe(
      false,
    );
  });

  it("accepts a valid UUID", () => {
    expect(postIdSchema.parse({ postId })).toEqual({ postId });
  });
});
