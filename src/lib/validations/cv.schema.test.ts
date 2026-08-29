import { describe, expect, it } from "vitest";

import { updateCvSchema } from "./cv.schema";

describe("updateCvSchema", () => {
  it("accepts an empty string", () => {
    expect(updateCvSchema.parse({ cv_md: "" })).toEqual({ cv_md: "" });
  });

  it("accepts markdown body text", () => {
    expect(updateCvSchema.parse({ cv_md: "# Title\n\nHello." })).toEqual({
      cv_md: "# Title\n\nHello.",
    });
  });

  it("rejects a missing cv_md field", () => {
    expect(updateCvSchema.safeParse({}).success).toBe(false);
  });
});
