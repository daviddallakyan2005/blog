"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArcadeShell } from "@/components/play/games/arcade-shell";

const WIDTH = 360;
const HEIGHT = 520;
const GROUND = 56;
const BIRD_X = 92;
const BIRD_RADIUS = 14;
const PIPE_WIDTH = 56;
const GAP = 148;
const PIPE_SPEED = 2.7;
const GRAVITY = 0.34;
const FLAP_VELOCITY = -6.2;

type Pipe = {
  x: number;
  gapY: number;
  scored: boolean;
};

type GameState = {
  birdY: number;
  birdVY: number;
  pipes: Pipe[];
  status: "idle" | "playing" | "over";
  score: number;
};

function createInitialState(): GameState {
  return {
    birdY: HEIGHT / 2 - 28,
    birdVY: 0,
    pipes: [
      { x: WIDTH + 100, gapY: 200, scored: false },
      { x: WIDTH + 300, gapY: 260, scored: false },
    ],
    status: "idle",
    score: 0,
  };
}

function randomGapY(): number {
  return 120 + Math.random() * 180;
}

export function WrappedFlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createInitialState());
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const [status, setStatus] = useState<GameState["status"]>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  const syncState = useCallback((next: Partial<GameState>) => {
    gameRef.current = { ...gameRef.current, ...next };
    if (next.status) setStatus(next.status);
    if (typeof next.score === "number") setScore(next.score);
  }, []);

  const reset = useCallback(() => {
    lastTimeRef.current = null;
    gameRef.current = createInitialState();
    setStatus("idle");
    setScore(0);
  }, []);

  const flap = useCallback(() => {
    const game = gameRef.current;
    if (game.status === "over") return;
    if (game.status === "idle") {
      game.status = "playing";
      setStatus("playing");
    }
    game.birdVY = FLAP_VELOCITY;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " && event.key !== "ArrowUp") return;
      event.preventDefault();
      flap();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (game: GameState) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, "#93c5fd");
      sky.addColorStop(1, "#dbeafe");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "#fcd34d";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(
          60 + i * 120,
          70 + (i % 2) * 24,
          18 + (i % 2) * 8,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }

      for (const pipe of game.pipes) {
        const topH = pipe.gapY;
        const bottomY = pipe.gapY + GAP;
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, topH);
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, HEIGHT - bottomY - GROUND);
        ctx.fillStyle = "#15803d";
        ctx.fillRect(pipe.x - 4, topH - 16, PIPE_WIDTH + 8, 16);
        ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 16);
      }

      ctx.fillStyle = "#84cc16";
      ctx.fillRect(0, HEIGHT - GROUND, WIDTH, GROUND);
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, HEIGHT - GROUND, WIDTH, 12);

      ctx.save();
      ctx.translate(BIRD_X, game.birdY);
      ctx.rotate(Math.max(-0.5, Math.min(0.8, game.birdVY * 0.08)));
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.moveTo(BIRD_RADIUS - 3, -2);
      ctx.lineTo(BIRD_RADIUS + 12, 3);
      ctx.lineTo(BIRD_RADIUS - 3, 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#111827";
      ctx.beginPath();
      ctx.arc(4, -4, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#0f172a";
      ctx.font = "600 24px system-ui";
      ctx.fillText(String(game.score), 20, 36);

      if (game.status !== "playing") {
        ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
        ctx.fillRect(24, HEIGHT / 2 - 54, WIDTH - 48, 108);
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "center";
        ctx.font = "700 24px system-ui";
        ctx.fillText(
          game.status === "over" ? "Game over" : "Click or press space",
          WIDTH / 2,
          HEIGHT / 2 - 6,
        );
        ctx.font = "500 15px system-ui";
        ctx.fillText(
          game.status === "over"
            ? "Restart below to try again."
            : "Flap through the gaps.",
          WIDTH / 2,
          HEIGHT / 2 + 24,
        );
        ctx.textAlign = "left";
      }
    };

    const tick = (time: number) => {
      const game = gameRef.current;
      const last = lastTimeRef.current ?? time;
      const dt = Math.min((time - last) / 16.67, 2);
      lastTimeRef.current = time;

      if (game.status === "playing") {
        game.birdVY += GRAVITY * dt;
        game.birdY += game.birdVY * dt;

        game.pipes.forEach((pipe) => {
          pipe.x -= PIPE_SPEED * dt;

          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_RADIUS) {
            pipe.scored = true;
            game.score += 1;
            setScore(game.score);
          }
        });

        const lastPipe = game.pipes[game.pipes.length - 1]!;
        if (lastPipe.x < WIDTH - 180) {
          game.pipes.push({
            x: WIDTH + 60,
            gapY: randomGapY(),
            scored: false,
          });
        }
        game.pipes = game.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -20);

        const hitGround = game.birdY + BIRD_RADIUS >= HEIGHT - GROUND;
        const hitCeiling = game.birdY - BIRD_RADIUS <= 0;
        const hitPipe = game.pipes.some((pipe) => {
          const withinX =
            BIRD_X + BIRD_RADIUS > pipe.x &&
            BIRD_X - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
          const withinGap =
            game.birdY - BIRD_RADIUS > pipe.gapY &&
            game.birdY + BIRD_RADIUS < pipe.gapY + GAP;
          return withinX && !withinGap;
        });

        if (hitGround || hitCeiling || hitPipe) {
          game.status = "over";
          setStatus("over");
          setBest((prev) => Math.max(prev, game.score));
        }
      }

      draw(game);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <ArcadeShell
      instructions={
        <>
          A straightforward React port: click, tap, or press space to flap
          through the pipes.
        </>
      }
      controls={
        <>
          <strong className="text-foreground">Controls:</strong>{" "}
          click/tap/space/up arrow to flap. Miss a gap and it is over.
        </>
      }
      actions={
        <>
          <Button type="button" size="sm" variant="secondary" onClick={reset}>
            Restart
          </Button>
          <div className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Score <span className="font-semibold text-foreground">{score}</span>{" "}
            · Best <span className="font-semibold text-foreground">{best}</span>
          </div>
        </>
      }
    >
      <button
        type="button"
        className="cursor-pointer rounded-lg outline-none"
        onClick={flap}
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="h-auto max-w-full rounded-lg"
        />
      </button>
    </ArcadeShell>
  );
}
