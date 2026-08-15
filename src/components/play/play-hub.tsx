"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";

import { WrappedMinesweeper } from "@/components/play/games/wrapped-minesweeper";
import { MatchCycleGame } from "@/components/play/match-cycle-game";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const Wrapped2048 = dynamic(
  () =>
    import("@/components/play/games/wrapped-2048").then((m) => m.Wrapped2048),
  { ssr: false, loading: () => <GameLoading label="2048" /> },
);

const WrappedSnake = dynamic(
  () =>
    import("@/components/play/games/wrapped-snake").then((m) => m.WrappedSnake),
  { ssr: false, loading: () => <GameLoading label="Snake" /> },
);

const WrappedTetris = dynamic(
  () =>
    import("@/components/play/games/wrapped-tetris").then(
      (m) => m.WrappedTetris,
    ),
  { ssr: false, loading: () => <GameLoading label="Tetris" /> },
);

const WrappedFlappyBird = dynamic(
  () =>
    import("@/components/play/games/wrapped-flappy-bird").then(
      (m) => m.WrappedFlappyBird,
    ),
  { ssr: false, loading: () => <GameLoading label="Flappy Bird" /> },
);

const WrappedSpaceInvaders = dynamic(
  () =>
    import("@/components/play/games/wrapped-space-invaders").then(
      (m) => m.WrappedSpaceInvaders,
    ),
  { ssr: false, loading: () => <GameLoading label="Space Invaders" /> },
);

const WrappedDoodleJump = dynamic(
  () =>
    import("@/components/play/games/wrapped-doodle-jump").then(
      (m) => m.WrappedDoodleJump,
    ),
  { ssr: false, loading: () => <GameLoading label="Doodle Jump" /> },
);

type GameId =
  | "match-cycle"
  | "2048"
  | "minesweeper"
  | "snake"
  | "tetris"
  | "flappy-bird"
  | "space-invaders"
  | "doodle-jump";

const GAMES: { id: GameId; title: string; description: string }[] = [
  {
    id: "match-cycle",
    title: "Match the cycle",
    description: "Trace a directed cycle on the graph.",
  },
  {
    id: "2048",
    title: "2048",
    description: "Merge tiles to reach 2048.",
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    description: "Reveal cells, flag bombs, clear the board.",
  },
  {
    id: "snake",
    title: "Snake",
    description: "Classic snake with wrap-around edges.",
  },
  {
    id: "tetris",
    title: "Tetris",
    description: "Stack pieces, rotate fast, clear lines.",
  },
  {
    id: "flappy-bird",
    title: "Flappy Bird",
    description: "Click or tap to flap through the pipes.",
  },
  {
    id: "space-invaders",
    title: "Space Invaders",
    description: "Move, shoot, and clear the incoming wave.",
  },
  {
    id: "doodle-jump",
    title: "Doodle Jump",
    description: "Bounce upward forever on floating platforms.",
  },
];

function GameLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed bg-muted/30">
      <p className="text-sm text-muted-foreground">Loading {label}…</p>
    </div>
  );
}

export function PlayHub() {
  const [selected, setSelected] = useState<GameId>("match-cycle");
  const boardRef = useRef<HTMLDivElement>(null);

  const selectedGame = useMemo(
    () => GAMES.find((game) => game.id === selected) ?? GAMES[0]!,
    [selected],
  );

  const selectGame = (id: GameId) => {
    setSelected(id);
    boardRef.current?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3 2xl:grid-cols-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            type="button"
            aria-pressed={selected === game.id}
            onClick={() => selectGame(game.id)}
            className="text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card
              className={cn(
                "h-full cursor-pointer transition-colors",
                selected === game.id
                  ? "border-accent ring-2 ring-accent"
                  : "hover:bg-muted/40",
              )}
            >
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-base">{game.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  {game.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </button>
        ))}
      </div>

      <Card ref={boardRef}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">{selectedGame.title}</CardTitle>
          <CardDescription>{selectedGame.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {selected === "match-cycle" && <MatchCycleGame embedded />}
          {selected === "2048" && <Wrapped2048 />}
          {selected === "minesweeper" && <WrappedMinesweeper />}
          {selected === "snake" && <WrappedSnake />}
          {selected === "tetris" && <WrappedTetris />}
          {selected === "flappy-bird" && <WrappedFlappyBird />}
          {selected === "space-invaders" && <WrappedSpaceInvaders />}
          {selected === "doodle-jump" && <WrappedDoodleJump />}
        </CardContent>
      </Card>
    </div>
  );
}
