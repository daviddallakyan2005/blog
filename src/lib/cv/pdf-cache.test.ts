import { describe, expect, it } from "vitest";

import { decodeCvPdfFromCache, encodeCvPdfForCache } from "./pdf-cache";

describe("encodeCvPdfForCache", () => {
  it("encodes PDF bytes as base64", () => {
    expect(encodeCvPdfForCache(Buffer.from("%PDF-1.4", "ascii"))).toBe(
      Buffer.from("%PDF-1.4", "ascii").toString("base64"),
    );
  });
});

describe("decodeCvPdfFromCache", () => {
  it("round-trips to bytes whose first four are %PDF", () => {
    const encoded = encodeCvPdfForCache(Buffer.from("%PDF-1.4 hello", "ascii"));
    const bytes = decodeCvPdfFromCache(encoded);

    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe("%PDF");
  });

  it("copies into a standalone ArrayBuffer", () => {
    const encoded = encodeCvPdfForCache(Buffer.from("%PDF-1.4", "ascii"));
    const bytes = decodeCvPdfFromCache(encoded);

    expect(bytes.byteOffset).toBe(0);
    expect(bytes.buffer.byteLength).toBe(bytes.byteLength);
  });
});
