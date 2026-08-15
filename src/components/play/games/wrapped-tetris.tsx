"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArcadeShell } from "@/components/play/games/arcade-shell";

import "./tetris.css";

type PieceType = "I" | "J" | "L" | "O" | "S" | "T" | "Z";
type Cell = PieceType | null;
type Board = Cell[][];
type Status = "playing" | "paused" | "over";

type Piece = {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
};

type GameState = {
  board: Board;
  current: Piece;
  queue: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  status: Status;
};

const BOARD_W = 10;
const BOARD_H = 20;
const PREVIEW_SIZE = 4;
const PIECE_TYPES: PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"];
const LINE_SCORES = [0, 100, 300, 500, 800];

const BASE_SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_H }, () =>
    Array.from({ length: BOARD_W }, () => null),
  );
}

function shuffleBag(): PieceType[] {
  const bag = [...PIECE_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j]!, bag[i]!];
  }
  return bag;
}

function ensureQueue(queue: PieceType[]): PieceType[] {
  const next = [...queue];
  while (next.length < 5) next.push(...shuffleBag());
  return next;
}

function rotateMatrix(matrix: number[][]): number[][] {
  return matrix[0]!.map((_, col) => matrix.map((row) => row[col]!).reverse());
}

function getShape(type: PieceType, rotation: number): number[][] {
  let shape = BASE_SHAPES[type].map((row) => [...row]);
  for (let i = 0; i < rotation; i++) shape = rotateMatrix(shape);
  return shape;
}

function createPiece(type: PieceType, rotation = 0): Piece {
  const shape = getShape(type, rotation);
  return {
    type,
    rotation,
    x: Math.floor((BOARD_W - shape[0]!.length) / 2),
    y: 0,
  };
}

function collides(
  board: Board,
  piece: Piece,
  dx = 0,
  dy = 0,
  rotation = piece.rotation,
): boolean {
  const shape = getShape(piece.type, rotation);
  return shape.some((row, rowIdx) =>
    row.some((value, colIdx) => {
      if (!value) return false;
      const x = piece.x + colIdx + dx;
      const y = piece.y + rowIdx + dy;
      if (x < 0 || x >= BOARD_W || y >= BOARD_H) return true;
      return y >= 0 && board[y]![x] !== null;
    }),
  );
}

function mergePiece(board: Board, piece: Piece): Board {
  const next = board.map((row) => [...row]);
  const shape = getShape(piece.type, piece.rotation);
  shape.forEach((row, rowIdx) => {
    row.forEach((value, colIdx) => {
      if (!value) return;
      const x = piece.x + colIdx;
      const y = piece.y + rowIdx;
      if (y >= 0 && y < BOARD_H && x >= 0 && x < BOARD_W) {
        next[y]![x] = piece.type;
      }
    });
  });
  return next;
}

function overlayPiece(board: Board, piece: Piece): Board {
  return mergePiece(board, piece);
}

function clearFullLines(board: Board): { board: Board; cleared: number } {
  const rows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_H - rows.length;
  while (rows.length < BOARD_H)
    rows.unshift(Array.from({ length: BOARD_W }, () => null));
  return { board: rows, cleared };
}

function spawnFromQueue(
  board: Board,
  queue: PieceType[],
): { current: Piece; queue: PieceType[]; status: Status } {
  const filledQueue = ensureQueue(queue);
  const [nextType, ...rest] = filledQueue;
  const current = createPiece(nextType!);
  const status: Status = collides(board, current) ? "over" : "playing";
  return { current, queue: ensureQueue(rest), status };
}

function initialState(): GameState {
  const board = createEmptyBoard();
  const { current, queue, status } = spawnFromQueue(board, shuffleBag());
  return {
    board,
    current,
    queue,
    hold: null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    status,
  };
}

function lockCurrentPiece(state: GameState): GameState {
  const mergedBoard = mergePiece(state.board, state.current);
  const { board, cleared } = clearFullLines(mergedBoard);
  const lines = state.lines + cleared;
  const level = Math.floor(lines / 10) + 1;
  const score = state.score + LINE_SCORES[cleared]! * level;
  const spawned = spawnFromQueue(board, state.queue);

  return {
    ...state,
    board,
    current: spawned.current,
    queue: spawned.queue,
    score,
    lines,
    level,
    canHold: true,
    status: spawned.status,
  };
}

function moveCurrent(state: GameState, dx: number, dy: number): GameState {
  if (state.status !== "playing") return state;
  if (collides(state.board, state.current, dx, dy)) {
    if (dy > 0) return lockCurrentPiece(state);
    return state;
  }
  return {
    ...state,
    current: {
      ...state.current,
      x: state.current.x + dx,
      y: state.current.y + dy,
    },
  };
}

function rotateCurrent(state: GameState, direction: 1 | -1): GameState {
  if (state.status !== "playing") return state;
  const nextRotation = (state.current.rotation + direction + 4) % 4;
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collides(state.board, state.current, kick, 0, nextRotation)) {
      return {
        ...state,
        current: {
          ...state.current,
          rotation: nextRotation,
          x: state.current.x + kick,
        },
      };
    }
  }
  return state;
}

function hardDrop(state: GameState): GameState {
  if (state.status !== "playing") return state;
  let next = state;
  while (!collides(next.board, next.current, 0, 1)) {
    next = { ...next, current: { ...next.current, y: next.current.y + 1 } };
  }
  return lockCurrentPiece(next);
}

function holdPiece(state: GameState): GameState {
  if (state.status !== "playing" || !state.canHold) return state;

  if (!state.hold) {
    const spawned = spawnFromQueue(state.board, state.queue);
    return {
      ...state,
      hold: state.current.type,
      current: spawned.current,
      queue: spawned.queue,
      canHold: false,
      status: spawned.status,
    };
  }

  const swapped = createPiece(state.hold);
  if (collides(state.board, swapped)) {
    return { ...state, status: "over" };
  }

  return {
    ...state,
    hold: state.current.type,
    current: swapped,
    canHold: false,
  };
}

function togglePause(state: GameState): GameState {
  if (state.status === "over") return state;
  return { ...state, status: state.status === "paused" ? "playing" : "paused" };
}

function PiecePreview({ type }: { type: PieceType | null }) {
  const shape = type
    ? getShape(type, 0)
    : Array.from({ length: PREVIEW_SIZE }, () =>
        Array.from({ length: PREVIEW_SIZE }, () => 0),
      );
  const padded = Array.from({ length: PREVIEW_SIZE }, (_, rowIdx) =>
    Array.from(
      { length: PREVIEW_SIZE },
      (_, colIdx) => shape[rowIdx]?.[colIdx] ?? 0,
    ),
  );

  return (
    <div className="play-tetris-preview-grid">
      {padded.flatMap((row, rowIdx) =>
        row.map((filled, colIdx) => (
          <div
            key={`${type ?? "empty"}-${rowIdx}-${colIdx}`}
            className={
              filled && type
                ? `play-tetris-cell play-tetris-piece-${type.toLowerCase()}`
                : "play-tetris-cell play-tetris-cell-empty"
            }
          />
        )),
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function WrappedTetris() {
  const [game, setGame] = useState<GameState>(() => initialState());

  const renderedBoard = useMemo(
    () => overlayPiece(game.board, game.current),
    [game.board, game.current],
  );

  const restart = useCallback(() => {
    setGame(initialState());
  }, []);

  const onTick = useCallback(() => {
    setGame((current) => moveCurrent(current, 0, 1));
  }, []);

  const onMoveLeft = useCallback(
    () => setGame((current) => moveCurrent(current, -1, 0)),
    [],
  );
  const onMoveRight = useCallback(
    () => setGame((current) => moveCurrent(current, 1, 0)),
    [],
  );
  const onSoftDrop = useCallback(
    () => setGame((current) => moveCurrent(current, 0, 1)),
    [],
  );
  const onRotateCW = useCallback(
    () => setGame((current) => rotateCurrent(current, 1)),
    [],
  );
  const onRotateCCW = useCallback(
    () => setGame((current) => rotateCurrent(current, -1)),
    [],
  );
  const onHardDrop = useCallback(
    () => setGame((current) => hardDrop(current)),
    [],
  );
  const onHold = useCallback(
    () => setGame((current) => holdPiece(current)),
    [],
  );
  const onPauseToggle = useCallback(
    () => setGame((current) => togglePause(current)),
    [],
  );

  useEffect(() => {
    if (game.status !== "playing") return;
    const tickDelay = Math.max(120, 720 - (game.level - 1) * 55);
    const id = window.setInterval(onTick, tickDelay);
    return () => window.clearInterval(id);
  }, [game.level, game.status, onTick]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (
        ![
          "arrowleft",
          "arrowright",
          "arrowdown",
          "arrowup",
          " ",
          "x",
          "z",
          "c",
          "p",
        ].includes(key)
      ) {
        return;
      }
      event.preventDefault();
      if (key === "arrowleft") onMoveLeft();
      if (key === "arrowright") onMoveRight();
      if (key === "arrowdown") onSoftDrop();
      if (key === "arrowup" || key === "x") onRotateCW();
      if (key === "z") onRotateCCW();
      if (key === " ") onHardDrop();
      if (key === "c") onHold();
      if (key === "p") onPauseToggle();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    onHardDrop,
    onHold,
    onMoveLeft,
    onMoveRight,
    onPauseToggle,
    onRotateCCW,
    onRotateCW,
    onSoftDrop,
  ]);

  return (
    <ArcadeShell
      wide
      instructions={
        <>
          A local Tetris implementation replaces the broken package version, so
          controls and the game loop stay inside this app instead of depending
          on old global key bindings.
        </>
      }
      controls={
        <>
          <strong className="text-foreground">Controls:</strong> left/right
          move, down soft drop, up or X rotate, Z counter-rotate, space hard
          drop, C hold, P pause.
        </>
      }
      actions={
        <>
          <Button type="button" size="sm" variant="secondary" onClick={restart}>
            New game
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPauseToggle}
          >
            {game.status === "paused" ? "Resume" : "Pause"}
          </Button>
        </>
      }
    >
      <div className="play-tetris grid gap-4 lg:grid-cols-[220px_minmax(280px,1fr)_220px]">
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <StatCard label="Points" value={game.score} />
            <StatCard label="Lines" value={game.lines} />
            <StatCard label="Level" value={game.level} />
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 text-sm font-medium">Status</div>
            <div className="text-sm text-muted-foreground">
              {game.status === "over"
                ? "Game over. Hit New game to restart."
                : game.status === "paused"
                  ? "Paused. Resume whenever you are ready."
                  : "Playing."}
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <div className="play-tetris-board">
            {renderedBoard.flatMap((row, rowIdx) =>
              row.map((cell, colIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={
                    cell
                      ? `play-tetris-cell play-tetris-piece-${cell.toLowerCase()}`
                      : "play-tetris-cell play-tetris-cell-empty"
                  }
                />
              )),
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 text-sm font-medium">Hold</div>
            <PiecePreview type={game.hold} />
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="mb-2 text-sm font-medium">Next</div>
            <div className="space-y-3">
              {game.queue.slice(0, 3).map((piece, idx) => (
                <PiecePreview key={`${piece}-${idx}`} type={piece} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </ArcadeShell>
  );
}
