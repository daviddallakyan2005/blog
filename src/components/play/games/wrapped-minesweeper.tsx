"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlayMinesweeper } from "@/components/play/games/play-minesweeper";

import "./minesweeper.css";

export function WrappedMinesweeper() {
  const [gameKey, setGameKey] = useState(0);

  const restart = useCallback(() => {
    setGameKey((k) => k + 1);
  }, []);

  return (
    <div className="flex flex-col items-stretch gap-4 py-2">
      <div className="space-y-2 text-sm text-muted-foreground max-w-xl">
        <p>
          <strong className="text-foreground">Reveal:</strong> normal click (one
          finger / left button).
        </p>
        <p>
          <strong className="text-foreground">Flag / unflag:</strong> two-finger
          click on a trackpad, Magic Mouse secondary corner, or right mouse
          button. If your browser still ignores that, use{" "}
          <strong className="text-foreground">Ctrl + click</strong>.
        </p>
        <p>
          <strong className="text-foreground">Touch:</strong> long-press for the
          same as a right-click.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={restart}>
          New game
        </Button>
      </div>

      <div className="flex justify-center overflow-x-auto rounded-lg border bg-muted/20 p-2">
        <PlayMinesweeper
          key={gameKey}
          width={12}
          height={12}
          bombChance={0.18}
        />
      </div>
    </div>
  );
}
