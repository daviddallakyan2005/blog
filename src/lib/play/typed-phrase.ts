export const MATCHED_PHRASES = ["helloworld"] as const;
export const MAX_BUFFER_LENGTH = 32;

export function normalizeTypedInput(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, "");
}

export function matchesUnlockPhrase(buffer: string): boolean {
  const normalized = normalizeTypedInput(buffer);
  return MATCHED_PHRASES.some((phrase) => normalized.endsWith(phrase));
}

export function appendTypedKey(buffer: string, key: string): string {
  return (buffer + key.toLowerCase()).slice(-MAX_BUFFER_LENGTH);
}
