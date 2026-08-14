import readingTime from "reading-time";

export type ReadingStats = {
  minutes: number;
  words: number;
};

export function readingStats(markdown: string): ReadingStats {
  const result = readingTime(markdown);
  return {
    minutes: Math.ceil(result.minutes),
    words: result.words,
  };
}
