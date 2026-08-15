"use client";

import { Snake } from "react-snake-lib";

export function WrappedSnake() {
  return (
    <div className="flex flex-col items-center gap-4 py-2 w-full max-w-lg mx-auto">
      <p className="text-sm text-muted-foreground text-center px-2 max-w-md">
        Press <strong className="text-foreground">Start</strong>, then use{" "}
        <strong className="text-foreground">arrow keys</strong> or{" "}
        <strong className="text-foreground">W A S D</strong>. Edges wrap, so
        leaving one side continues on the opposite side.
      </p>

      <div className="mx-auto w-full max-w-[420px] aspect-square min-w-0">
        <Snake
          width="100%"
          height="100%"
          size={14}
          noWall
          snakeSpeed={95}
          bgColor="var(--card)"
          borderColor="var(--border)"
          innerBorderColor="var(--muted)"
          snakeColor="var(--accent)"
          snakeHeadColor="var(--foreground)"
          appleColor="#b91c1c"
          boxShadow="0 4px 24px oklch(0 0 0 / 0.08)"
          borderWidth={1}
          borderRadius={8}
          snakeHeadRadius={6}
          startGameText="Start"
          startButtonStyle={{
            borderRadius: "8px",
            border: "1px solid var(--border)",
            cursor: "pointer",
            padding: "10px 20px",
            backgroundColor: "var(--muted)",
            color: "var(--foreground)",
            fontWeight: 600,
          }}
          startButtonHoverStyle={{
            backgroundColor: "var(--accent)",
            color: "var(--accent-foreground)",
          }}
        />
      </div>
    </div>
  );
}
