"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArcadeShell } from "@/components/play/games/arcade-shell";

const WIDTH = 360;
const HEIGHT = 520;
const PLAYER_W = 42;
const PLAYER_H = 42;
const PLATFORM_W = 76;
const PLATFORM_H = 12;
const GRAVITY = 0.32;
const BOOST_GRAVITY = 0.12;
const JUMP_VELOCITY = -8.6;
const SPRING_VELOCITY = -11.8;
const BOOST_VELOCITY = -13.8;
const SCROLL_Y = 190;
const PLATFORM_COUNT = 9;
const MIN_GAP = 56;
const MAX_GAP = 86;
const MAX_X_DELTA = 116;

type PlatformKind = "normal" | "moving" | "breakable";

type Platform = {
  x: number;
  y: number;
  width: number;
  kind: PlatformKind;
  direction: 1 | -1;
  speed: number;
  broken: boolean;
  spring: boolean;
  jetpack: boolean;
};

type GameState = {
  status: "idle" | "playing" | "over";
  playerX: number;
  playerY: number;
  playerVY: number;
  facing: 1 | -1;
  platforms: Platform[];
  score: number;
  boostFrames: number;
};

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function choosePlatformKind(score: number): PlatformKind {
  const roll = Math.random();
  if (score > 450 && roll < 0.16) return "breakable";
  if (score > 120 && roll < 0.36) return "moving";
  return "normal";
}

function spawnPlatformAbove(
  anchor: Pick<Platform, "x" | "y">,
  score: number,
): Platform {
  const kind = choosePlatformKind(score);
  const gap = rand(MIN_GAP, MAX_GAP);
  const width =
    kind === "moving"
      ? PLATFORM_W - 8
      : kind === "breakable"
        ? PLATFORM_W - 4
        : PLATFORM_W;
  const x = clamp(
    anchor.x + rand(-MAX_X_DELTA, MAX_X_DELTA),
    18,
    WIDTH - width - 18,
  );
  const spring =
    kind !== "breakable" && Math.random() < (score > 220 ? 0.2 : 0.1);
  const jetpack =
    !spring && kind === "normal" && score > 320 && Math.random() < 0.06;

  return {
    x,
    y: anchor.y - gap,
    width,
    kind,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: kind === "moving" ? rand(0.7, 1.4) : 0,
    broken: false,
    spring,
    jetpack,
  };
}

function createPlatformChain(score = 0): Platform[] {
  const first: Platform = {
    x: WIDTH / 2 - PLATFORM_W / 2,
    y: HEIGHT - 54,
    width: PLATFORM_W,
    kind: "normal",
    direction: 1,
    speed: 0,
    broken: false,
    spring: false,
    jetpack: false,
  };

  const chain = [first];
  while (chain.length < PLATFORM_COUNT) {
    chain.push(spawnPlatformAbove(chain[chain.length - 1]!, score));
  }
  return chain;
}

function createInitialState(): GameState {
  return {
    status: "idle",
    playerX: WIDTH / 2 - PLAYER_W / 2,
    playerY: HEIGHT - 120,
    playerVY: JUMP_VELOCITY,
    facing: 1,
    platforms: createPlatformChain(),
    score: 0,
    boostFrames: 0,
  };
}

export function WrappedDoodleJump() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<GameState>(createInitialState());
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const directionRef = useRef(0);

  const [status, setStatus] = useState<GameState["status"]>("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [perk, setPerk] = useState<string>("None");

  const reset = useCallback(() => {
    gameRef.current = createInitialState();
    lastTimeRef.current = null;
    setStatus("idle");
    setScore(0);
    setPerk("None");
  }, []);

  const start = useCallback(() => {
    const game = gameRef.current;
    if (game.status === "over") {
      reset();
      return;
    }
    game.status = "playing";
    setStatus("playing");
  }, [reset]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && status !== "playing") {
        event.preventDefault();
        start();
        return;
      }
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")
        directionRef.current = -1;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d")
        directionRef.current = 1;
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "a" ||
        event.key.toLowerCase() === "d"
      ) {
        directionRef.current = 0;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [start, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const recyclePlatforms = (game: GameState) => {
      let anchor = [...game.platforms]
        .filter((platform) => !platform.broken)
        .sort((a, b) => a.y - b.y)[0] ?? {
        x: WIDTH / 2 - PLATFORM_W / 2,
        y: 70,
      };

      game.platforms.forEach((platform) => {
        if (
          platform.y <= HEIGHT + 18 &&
          !(platform.broken && platform.y > HEIGHT - 40)
        )
          return;
        const replacement = spawnPlatformAbove(anchor, game.score);
        platform.x = replacement.x;
        platform.y = replacement.y;
        platform.width = replacement.width;
        platform.kind = replacement.kind;
        platform.direction = replacement.direction;
        platform.speed = replacement.speed;
        platform.broken = false;
        platform.spring = replacement.spring;
        platform.jetpack = replacement.jetpack;
        anchor = replacement;
      });
    };

    const drawCharacter = (game: GameState) => {
      const x = game.playerX;
      const y = game.playerY;
      const dir = game.facing;

      ctx.save();
      ctx.translate(x + PLAYER_W / 2, y + PLAYER_H / 2);
      ctx.scale(dir, 1);
      ctx.translate(-PLAYER_W / 2, -PLAYER_H / 2);

      // Legal-safe doodle-style hero; exact proprietary Doodle Jump character is not shipped.
      ctx.fillStyle = "#7ddc3a";
      ctx.beginPath();
      ctx.ellipse(20, 18, 16, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillRect(10, 24, 20, 10);
      ctx.fillStyle = "#111827";
      ctx.fillRect(16, 16, 3, 3);
      ctx.fillRect(24, 16, 3, 3);
      ctx.fillRect(27, 18, 8, 2);
      ctx.fillStyle = "#fb7185";
      ctx.fillRect(31, 17, 6, 4);
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(13, 34, 4, 8);
      ctx.fillRect(24, 34, 4, 8);
      ctx.fillStyle = "#facc15";
      ctx.fillRect(11, 41, 7, 2);
      ctx.fillRect(23, 41, 7, 2);

      if (game.boostFrames > 0) {
        ctx.fillStyle = "#f97316";
        ctx.beginPath();
        ctx.moveTo(8, 34);
        ctx.lineTo(14, 52);
        ctx.lineTo(20, 34);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, 34);
        ctx.lineTo(26, 54);
        ctx.lineTo(32, 34);
        ctx.fill();
      }

      ctx.restore();
    };

    const draw = (game: GameState) => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, "#d9f99d");
      sky.addColorStop(1, "#dbeafe");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      game.platforms.forEach((platform) => {
        if (platform.broken) return;
        ctx.fillStyle =
          platform.kind === "moving"
            ? "#0ea5e9"
            : platform.kind === "breakable"
              ? "#f97316"
              : "#22c55e";
        ctx.fillRect(platform.x, platform.y, platform.width, PLATFORM_H);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(platform.x + 4, platform.y - 3, platform.width - 8, 3);

        if (platform.spring) {
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(platform.x + platform.width / 2 - 8, platform.y);
          ctx.lineTo(platform.x + platform.width / 2 - 3, platform.y - 8);
          ctx.lineTo(platform.x + platform.width / 2 + 2, platform.y);
          ctx.lineTo(platform.x + platform.width / 2 + 7, platform.y - 8);
          ctx.lineTo(platform.x + platform.width / 2 + 12, platform.y);
          ctx.stroke();
        }

        if (platform.jetpack) {
          ctx.fillStyle = "#7c3aed";
          ctx.fillRect(
            platform.x + platform.width / 2 - 8,
            platform.y - 18,
            16,
            12,
          );
          ctx.fillStyle = "#22d3ee";
          ctx.fillRect(
            platform.x + platform.width / 2 - 5,
            platform.y - 14,
            4,
            8,
          );
          ctx.fillRect(
            platform.x + platform.width / 2 + 1,
            platform.y - 14,
            4,
            8,
          );
        }
      });

      drawCharacter(game);

      ctx.fillStyle = "#0f172a";
      ctx.font = "600 22px system-ui";
      ctx.fillText(String(Math.floor(game.score)), 20, 34);

      if (game.status !== "playing") {
        ctx.fillStyle = "rgba(15, 23, 42, 0.5)";
        ctx.fillRect(28, HEIGHT / 2 - 52, WIDTH - 56, 104);
        ctx.fillStyle = "#f8fafc";
        ctx.textAlign = "center";
        ctx.font = "700 24px system-ui";
        ctx.fillText(
          game.status === "over" ? "You fell" : "Press Enter to jump",
          WIDTH / 2,
          HEIGHT / 2 - 4,
        );
        ctx.font = "500 15px system-ui";
        ctx.fillText(
          "Move with arrow keys or A / D.",
          WIDTH / 2,
          HEIGHT / 2 + 24,
        );
        ctx.textAlign = "left";
      }
    };

    const step = (time: number) => {
      const game = gameRef.current;
      const last = lastTimeRef.current ?? time;
      const dt = Math.min((time - last) / 16.67, 2);
      lastTimeRef.current = time;

      if (game.status === "playing") {
        game.playerX += directionRef.current * 4.8 * dt;
        if (directionRef.current !== 0)
          game.facing = directionRef.current === 1 ? 1 : -1;
        if (game.playerX > WIDTH) game.playerX = -PLAYER_W;
        if (game.playerX < -PLAYER_W) game.playerX = WIDTH;

        game.platforms.forEach((platform) => {
          if (platform.kind !== "moving" || platform.broken) return;
          platform.x += platform.direction * platform.speed * 2.2 * dt;
          if (platform.x < 18 || platform.x + platform.width > WIDTH - 18) {
            platform.direction = platform.direction === 1 ? -1 : 1;
            platform.x = clamp(platform.x, 18, WIDTH - platform.width - 18);
          }
        });

        if (game.boostFrames > 0) {
          game.playerVY += BOOST_GRAVITY * dt;
          game.boostFrames = Math.max(0, game.boostFrames - 1 * dt);
        } else {
          game.playerVY += GRAVITY * dt;
        }
        game.playerY += game.playerVY * dt;

        if (game.playerVY > 0) {
          for (const platform of game.platforms) {
            if (platform.broken) continue;
            const feet = game.playerY + PLAYER_H;
            const wasAbove = feet - game.playerVY * dt <= platform.y;
            const overlapsX =
              game.playerX + PLAYER_W > platform.x &&
              game.playerX < platform.x + platform.width;
            const landsOnPlatform =
              overlapsX &&
              wasAbove &&
              feet >= platform.y &&
              feet <= platform.y + PLATFORM_H + 12;
            if (!landsOnPlatform) continue;

            if (platform.kind === "breakable") {
              // Real Doodle Jump behavior: the first landing still gives you a jump,
              // then the platform crumbles so it cannot save you a second time.
              platform.broken = true;
              game.playerVY = JUMP_VELOCITY;
              setPerk("Breakable platform");
              break;
            }

            if (platform.jetpack) {
              platform.jetpack = false;
              game.boostFrames = 42;
              game.playerVY = BOOST_VELOCITY;
              setPerk("Jetpack boost");
              break;
            }

            if (platform.spring) {
              platform.spring = false;
              game.playerVY = SPRING_VELOCITY;
              setPerk("Spring");
              break;
            }

            game.playerVY = JUMP_VELOCITY;
            setPerk(
              platform.kind === "moving" ? "Moving platform" : "Normal jump",
            );
            break;
          }
        }

        if (game.playerY < SCROLL_Y && game.playerVY < 0) {
          const delta = SCROLL_Y - game.playerY;
          game.playerY = SCROLL_Y;
          game.platforms.forEach((platform) => {
            platform.y += delta;
          });
          recyclePlatforms(game);
          game.score += delta * 0.12;
          setScore(Math.floor(game.score));
        } else {
          recyclePlatforms(game);
        }

        if (game.playerY > HEIGHT) {
          game.status = "over";
          setStatus("over");
          setBest((prev) => Math.max(prev, Math.floor(game.score)));
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
          Reachability is now constrained so the next platform chain stays
          playable, and the run includes springs, moving platforms, breakables,
          and jetpack boosts.
        </>
      }
      controls={
        <>
          <strong className="text-foreground">Controls:</strong> Enter starts,
          left/right or A/D move.
        </>
      }
      actions={
        <>
          <Button type="button" size="sm" variant="secondary" onClick={start}>
            {status === "playing"
              ? "Playing"
              : status === "over"
                ? "Restart"
                : "Start"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            Reset
          </Button>
          <div className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Height{" "}
            <span className="font-semibold text-foreground">
              {Math.floor(score)}
            </span>{" "}
            · Best <span className="font-semibold text-foreground">{best}</span>
          </div>
          <div className="rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Perk <span className="font-semibold text-foreground">{perk}</span>
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
