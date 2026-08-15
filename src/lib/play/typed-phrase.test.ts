import { describe, expect, it } from "vitest";

import {
  appendTypedKey,
  matchesUnlockPhrase,
  MAX_BUFFER_LENGTH,
} from "./typed-phrase";

describe("matchesUnlockPhrase", () => {
  it("matches helloworld with spaces and punctuation stripped", () => {
    expect(matchesUnlockPhrase("helloworld")).toBe(true);
    expect(matchesUnlockPhrase("hello world")).toBe(true);
    expect(matchesUnlockPhrase("Hello, World!")).toBe(true);
  });

  it("does not match iamdone or incomplete prefixes", () => {
    expect(matchesUnlockPhrase("iamdone")).toBe(false);
    expect(matchesUnlockPhrase("hello")).toBe(false);
    expect(matchesUnlockPhrase("helloworl")).toBe(false);
  });
});

describe("appendTypedKey", () => {
  it("still matches helloworld after the buffer is sliced", () => {
    let buffer = "";
    const typed = `${"x".repeat(MAX_BUFFER_LENGTH)}helloworld`;
    for (const key of typed) {
      buffer = appendTypedKey(buffer, key);
    }
    expect(buffer.length).toBe(MAX_BUFFER_LENGTH);
    expect(matchesUnlockPhrase(buffer)).toBe(true);
  });
});
