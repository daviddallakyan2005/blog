import { describe, expect, it } from "vitest";

import { createCommentSchema } from "./comments.schema";

const postId = "11111111-1111-4111-8111-111111111111";

describe("createCommentSchema", () => {
  it("rejects a body longer than 2000 characters", () => {
    const result = createCommentSchema.safeParse({
      body: "x".repeat(2001),
      postId,
    });

    expect(result.success).toBe(false);
  });
});
