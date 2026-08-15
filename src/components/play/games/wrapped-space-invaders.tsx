"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArcadeShell } from "@/components/play/games/arcade-shell";

const WIDTH = 380;
const HEIGHT = 520;
const PLAYER_W = 42;
const PLAYER_H = 18;
const ENEMY_ROWS = 4;
const ENEMY_COLS = 8;
const ENEMY_W = 26;
const ENEMY_H = 18;

type Enemy = {
  x: number;
  y: number;
  alive: boolean;
};

type Bullet = { x: number; y: number; vy: number };

type GameState = {
  status: "idle" | "playing" | "over" | "won";
  playerX: number;
  enemies: Enemy[];
  direction: 1 | -1;
  bullets: Bullet[];
  enemyBullets: Bullet[];
  score: number;
  lastShotAt: number;
  lastEnemyShotAt: number;
};

function createEnemies(): Enemy[] {
  const enemies: Enemy[] = [];
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      enemies.push({
        x: 40 + col * 38,
        y: 50 + row * 34,
        alive: true,
      });
    }
  }
  return enemies;
}

function createInitialState(): GameState {
  return {
    status: "idle",
    playerX: WIDTH / 2 - PLAYER_W / 2,
    enemies: createEnemies(),
    direction: 1,
    bullets: [],
    enemyBullets: [],
    score: 0,
    lastShotAt: 0,
    lastEnemyShotAt: 0,
  };
}

function rectHit(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

export function WrappedSpaceInvaders() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createInitialState());
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const moveRef = useRef(0);

  const [status, setStatus] = useState<GameState["status"]>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const reset = useCallback(() => {
    gameRef.current = createInitialState();
    lastTimeRef.current = null;
    setStatus("idle");
    setScore(0);
  }, []);

  const start = useCallback(() => {
    if (gameRef.current.status === "over" || gameRef.current.status === "won") {
      reset();
    }
    gameRef.current.status = "playing";
    setStatus("playing");
  }, [reset]);

  const shoot = useCallback(() => {
    const game = gameRef.current;
    if (game.status === "idle") {
      game.status = "playing";
      setStatus("playing");
    }
    if (game.status !== "playing") return;
    const now = performance.now();
    if (now - game.lastShotAt < 220) return;
    game.lastShotAt = now;
    game.bullets.push({
      x: game.playerX + PLAYER_W / 2 - 2,
      y: HEIGHT - 52,
      vy: -7.6,
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")
        moveRef.current = -1;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
        moveRef.current = 1;
      if (event.key === " " || event.key === "ArrowUp") {
        event.preventDefault();
        shoot();
      }
      if (event.key === "Enter" && status !== "playing") {
        event.preventDefault();
        start();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "a" ||
        event.key.toLowerCase() === "d"
      ) {
        moveRef.current = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [shoot, start, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (game: GameState) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "#1e293b";
      for (let i = 0; i < 70; i++) {
        ctx.fillRect((i * 47) % WIDTH, (i * 83) % HEIGHT, 2, 2);
      }

      for (const enemy of game.enemies) {
        if (!enemy.alive) continue;
        ctx.fillStyle = "#22d3ee";
        ctx.fillRect(enemy.x, enemy.y, ENEMY_W, ENEMY_H);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(enemy.x + 4, enemy.y + 4, 4, 4);
        ctx.fillRect(enemy.x + ENEMY_W - 8, enemy.y + 4, 4, 4);
      }

      ctx.fillStyle = "#4ade80";
      ctx.fillRect(game.playerX, HEIGHT - 34, PLAYER_W, PLAYER_H);

      ctx.fillStyle = "#f8fafc";
      for (const bullet of game.bullets)
        ctx.fillRect(bullet.x, bullet.y, 4, 12);
      ctx.fillStyle = "#f87171";
      for (const bullet of game.enemyBullets)
        ctx.fillRect(bullet.x, bullet.y, 4, 10);

      ctx.fillStyle = "#f8fafc";
      ctx.font = "600 20px system-ui";
      ctx.fillText(`Score ${game.score}`, 16, 28);

      if (game.status !== "playing") {
        ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
        ctx.fillRect(36, HEIGHT / 2 - 54, WIDTH - 72, 108);
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "center";
        ctx.font = "700 24px system-ui";
        const title =
          game.status === "won"
            ? "Wave cleared"
            : game.status === "over"
              ? "Game over"
              : "Press Enter to begin";
        ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 4);
        ctx.font = "500 15px system-ui";
        ctx.fillText("Move, shoot, survive.", WIDTH / 2, HEIGHT / 2 + 24);
        ctx.textAlign = "left";
      }
    };

    const step = (time: number) => {
      const game = gameRef.current;
      const last = lastTimeRef.current ?? time;
      const dt = Math.min((time - last) / 16.67, 2);
      lastTimeRef.current = time;

      if (game.status === "playing") {
        game.playerX = Math.max(
          10,
          Math.min(
            WIDTH - PLAYER_W - 10,
            game.playerX + moveRef.current * 4.8 * dt,
          ),
        );

        let hitEdge = false;
        for (const enemy of game.enemies) {
          if (!enemy.alive) continue;
          enemy.x += game.direction * 0.52 * dt;
          if (enemy.x <= 12 || enemy.x + ENEMY_W >= WIDTH - 12) hitEdge = true;
        }
        if (hitEdge) {
          game.direction = game.direction === 1 ? -1 : 1;
          for (const enemy of game.enemies) {
            if (enemy.alive) enemy.y += 18;
          }
        }

        game.bullets = game.bullets
          .map((bullet) => ({ ...bullet, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y > -16);

        game.enemyBullets = game.enemyBullets
          .map((bullet) => ({ ...bullet, y: bullet.y + bullet.vy * dt }))
          .filter((bullet) => bullet.y < HEIGHT + 16);

        for (const bullet of game.bullets) {
          for (const enemy of game.enemies) {
            if (!enemy.alive) continue;
            if (
              rectHit(
                { x: bullet.x, y: bullet.y, w: 4, h: 12 },
                { x: enemy.x, y: enemy.y, w: ENEMY_W, h: ENEMY_H },
              )
            ) {
              enemy.alive = false;
              bullet.y = -999;
              game.score += 10;
              setScore(game.score);
              break;
            }
          }
        }
        game.bullets = game.bullets.filter((bullet) => bullet.y > -100);

        const now = performance.now();
        if (now - game.lastEnemyShotAt > 800) {
          const alive = game.enemies.filter((enemy) => enemy.alive);
          if (alive.length > 0) {
            const shooter = alive[Math.floor(Math.random() * alive.length)]!;
            game.enemyBullets.push({
              x: shooter.x + ENEMY_W / 2,
              y: shooter.y + ENEMY_H,
              vy: 4.4,
            });
            game.lastEnemyShotAt = now;
          }
        }

        const playerRect = {
          x: game.playerX,
          y: HEIGHT - 34,
          w: PLAYER_W,
          h: PLAYER_H,
        };
        if (
          game.enemyBullets.some((bullet) =>
            rectHit({ x: bullet.x, y: bullet.y, w: 4, h: 10 }, playerRect),
          )
        ) {
          game.status = "over";
          setStatus("over");
          setBest((prev) => Math.max(prev, game.score));
        }

        const activeEnemies = game.enemies.filter((enemy) => enemy.alive);
        if (activeEnemies.some((enemy) => enemy.y + ENEMY_H >= HEIGHT - 40)) {
          game.status = "over";
          setStatus("over");
          setBest((prev) => Math.max(prev, game.score));
        } else if (activeEnemies.length === 0) {
          game.status = "won";
          setStatus("won");
          setBest((prev) => Math.max(prev, game.score));
        }
      }

      draw(game);
      animationRef.current = window.requestAnimationFrame(step);
    };

    animationRef.current = window.requestAnimationFrame(step);
    return () => {
      if (animationRef.current)
        window.cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <ArcadeShell
      instructions={
        <>
          A repo-inspired arcade shooter: clear the invader wave before they
          reach the bottom line.
        </>
      }
      controls={
        <>
          <strong className="text-foreground">Controls:</strong> Enter starts,
          left/right or A/D move, space shoots.
        </>
      }
      actions={
        <>
          <Button type="button" size="sm" variant="secondary" onClick={start}>
            {status === "playing"
              ? "Playing"
              : status === "won" || status === "over"
                ? "Restart"
                : "Start"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
          <div className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Score <span className="font-semibold text-foreground">{score}</span>{" "}
            · Best <span className="font-semibold text-foreground">{best}</span>
          </div>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="h-auto max-w-full rounded-lg"
      />
    </ArcadeShell>
  );
}
