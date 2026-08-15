"use client";

import { useCallback, useReducer, useRef } from "react";

type Field = {
  isFlagged: boolean;
  isRevealed: boolean;
  bombsAround: number;
  isBomb: boolean;
};

export type PlayMinesweeperProps = {
  width: number;
  height: number;
  bombChance: number;
  onWin?: () => void;
  onLose?: () => void;
};

type GameState = {
  board: Field[][];
  isLost: boolean;
  isWon: boolean;
};

function getField(
  board: Field[][],
  row: number,
  col: number,
): Field | undefined {
  return board[row]?.[col];
}

function generateBoard(
  width: number,
  height: number,
  bombChance: number,
): Field[][] {
  const board: Field[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      isFlagged: false,
      isRevealed: false,
      bombsAround: 0,
      isBomb: Math.random() > 1 - bombChance,
    })),
  );

  board.forEach((row, y) => {
    row.forEach((field, x) => {
      if (field.isBomb) return;
      let count = 0;
      loopFieldsAround(board, x, y, (f) => {
        if (f?.isBomb) count++;
      });
      field.bombsAround = count;
    });
  });

  return board;
}

function loopFieldsAround(
  board: Field[][],
  x: number,
  y: number,
  cb: (f: Field | undefined, cx: number, cy: number) => void,
) {
  for (let i = y - 1; i <= y + 1; i++) {
    for (let j = x - 1; j <= x + 1; j++) {
      cb(getField(board, i, j), j, i);
    }
  }
}

function initState(
  width: number,
  height: number,
  bombChance: number,
): GameState {
  return {
    board: generateBoard(width, height, bombChance),
    isLost: false,
    isWon: false,
  };
}

type Action =
  | { type: "toggleFlag"; y: number; x: number }
  | {
      type: "reveal";
      y: number;
      x: number;
      onWin?: () => void;
      onLose?: () => void;
    };

function gameReducer(state: GameState, action: Action): GameState {
  if (state.isLost || state.isWon) return state;

  if (action.type === "toggleFlag") {
    const { y, x } = action;
    const field = state.board[y]?.[x];
    if (!field || field.isRevealed) return state;
    const board = state.board.map((row) => row.map((c) => ({ ...c })));
    board[y]![x]!.isFlagged = !board[y]![x]!.isFlagged;
    return { ...state, board };
  }

  if (action.type === "reveal") {
    const { y, x, onWin, onLose } = action;
    const boardCopy = state.board.map((row) => row.map((c) => ({ ...c })));
    const clicked = boardCopy[y]?.[x];
    if (!clicked || clicked.isFlagged) return state;

    const fieldsToReveal: { x: number; y: number }[] = [{ x, y }];

    const lookAround = (cx: number, cy: number) => {
      const directions = [
        { x: cx, y: cy - 1 },
        { x: cx + 1, y: cy },
        { x: cx, y: cy + 1 },
        { x: cx - 1, y: cy },
      ];
      for (const dir of directions) {
        const field = getField(boardCopy, dir.y, dir.x);
        const exists = fieldsToReveal.some(
          (p) => p.x === dir.x && p.y === dir.y,
        );
        if (field && !field.isBomb && !exists) {
          fieldsToReveal.push(dir);
          if (field.bombsAround === 0) lookAround(dir.x, dir.y);
        }
      }
    };

    if (clicked.bombsAround === 0) lookAround(x, y);
    else if (clicked.isRevealed) {
      let flaggedInRange = 0;
      const unflagged: { x: number; y: number }[] = [];
      loopFieldsAround(boardCopy, x, y, (field, fx, fy) => {
        if (field) {
          if (field.isFlagged) flaggedInRange++;
          else unflagged.push({ x: fx, y: fy });
        }
      });
      if (clicked.bombsAround === flaggedInRange) {
        fieldsToReveal.push(...unflagged);
      }
    }

    let nextLost = false;
    let nextWon = false;

    fieldsToReveal.forEach(({ x: rx, y: ry }) => {
      const field = boardCopy[ry]![rx]!;
      field.isRevealed = true;
      if (field.isBomb) nextLost = true;
    });

    if (!nextLost) {
      let unrevealed = 0;
      boardCopy.forEach((row) => {
        row.forEach((f) => {
          if (!f.isRevealed && !f.isBomb) unrevealed++;
        });
      });
      nextWon = unrevealed === 0;
    }

    if (nextLost) onLose?.();
    else if (nextWon) onWin?.();

    return { board: boardCopy, isLost: nextLost, isWon: nextWon };
  }

  return state;
}

/**
 * Minesweeper with reliable flag toggling on macOS:
 * - secondary click uses `pointerdown` button 2
 * - `contextmenu` covers long-press / browser-only cases
 * - `Ctrl` + click also flags on Mac
 */
export function PlayMinesweeper({
  width,
  height,
  bombChance,
  onWin,
  onLose,
}: PlayMinesweeperProps) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { width, height, bombChance },
    ({ width: w, height: h, bombChance: bc }) => initState(w, h, bc),
  );

  const secondaryPointerRef = useRef(false);

  const toggleFlag = useCallback((y: number, x: number) => {
    dispatch({ type: "toggleFlag", y, x });
  }, []);

  const reveal = useCallback(
    (y: number, x: number) => {
      dispatch({ type: "reveal", y, x, onWin, onLose });
    },
    [onLose, onWin],
  );

  const onCellPointerDown =
    (y: number, x: number) => (e: React.PointerEvent) => {
      if (e.button === 2) {
        e.preventDefault();
        secondaryPointerRef.current = true;
        toggleFlag(y, x);
        return;
      }

      if (e.button === 0 && e.ctrlKey) {
        e.preventDefault();
        toggleFlag(y, x);
      }
    };

  const onCellContextMenu = (y: number, x: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (secondaryPointerRef.current) {
      secondaryPointerRef.current = false;
      return;
    }
    toggleFlag(y, x);
  };

  const onCellClick = (y: number, x: number) => (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) return;
    reveal(y, x);
  };

  const { board, isLost, isWon } = state;

  let tableClass = "minesweeper";
  if (isLost) tableClass += " minesweeper_lost";
  else if (isWon) tableClass += " minesweeper_won";
  else tableClass += " minesweeper_active";

  return (
    <table className={tableClass}>
      <tbody className="minesweeper__body">
        {board.map((row, y) => (
          <tr key={y} className="minesweeper__row">
            {row.map((field, x) => {
              let cellClass = `minesweeper__field minesweeper__field_${field.bombsAround}`;
              if (!(field.isRevealed || isLost))
                cellClass += " minesweeper__field_cloud";
              if (field.isFlagged && !isLost)
                cellClass += " minesweeper__field_flag";
              if (field.isBomb) cellClass += " minesweeper__field_bomb";

              return (
                <td
                  key={x}
                  className={cellClass}
                  onClick={onCellClick(y, x)}
                  onPointerDown={onCellPointerDown(y, x)}
                  onContextMenu={onCellContextMenu(y, x)}
                >
                  {field.bombsAround || ""}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
