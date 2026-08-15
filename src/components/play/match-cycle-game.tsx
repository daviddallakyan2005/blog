"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildEdgeSet,
  canAppendToPath,
  DEFAULT_VERTEX_COUNT,
  edgeKey,
  generatePuzzle,
  isValidSimpleCycle,
  MAX_VERTEX_COUNT,
  MIN_VERTEX_COUNT,
  nodeLabel,
} from "@/lib/play/match-cycle-puzzle";
import { X } from "lucide-react";

const NODE_R = 26;
const W = 560;
const H = 380;
const CX = W / 2;
const CY = H / 2;
const RING = 148;
const EDGE_STROKE_WIDTH = 1.5;
const SHAKE_MS = 500;
const VERTEX_OPTIONS = Array.from(
  { length: MAX_VERTEX_COUNT - MIN_VERTEX_COUNT + 1 },
  (_, i) => MIN_VERTEX_COUNT + i,
);

/** Fixed seed for first paint so SSR and client markup match (`Date.now()` would hydrate-mismatch). */
const HYDRATION_SAFE_INITIAL_SEED = 0x5eedba11;

function nodePositions(n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: CX + RING * Math.cos(a), y: CY + RING * Math.sin(a) };
  });
}

function shortenSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pad1: number,
  pad2: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 + ux * pad1,
    y1: y1 + uy * pad1,
    x2: x2 - ux * pad2,
    y2: y2 - uy * pad2,
  };
}

/**
 * Pixels to bend parallel A→B / B→A edges apart (quadratic control point offset).
 * Perp must come from a fixed min→max direction so both arrows curve to opposite sides.
 */
const BIDIRECTIONAL_CURVE = 28;

/**
 * Straight `M…L…` or curved `M…Q…` so reverse edges between the same two nodes don’t overlap.
 * Uses perpendicular from lower node id → higher node id (centers); `bend` picks side by direction.
 */
function edgeSvgD(
  edgeSet: Set<string>,
  from: number,
  to: number,
  pFrom: { x: number; y: number },
  pTo: { x: number; y: number },
  centers: { x: number; y: number }[],
): string {
  const seg = shortenSegment(
    pFrom.x,
    pFrom.y,
    pTo.x,
    pTo.y,
    NODE_R + 2,
    NODE_R + 6,
  );
  if (!edgeSet.has(edgeKey(to, from))) {
    return `M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}`;
  }
  const minN = Math.min(from, to);
  const maxN = Math.max(from, to);
  const pLo = centers[minN]!;
  const pHi = centers[maxN]!;
  const dx = pHi.x - pLo.x;
  const dy = pHi.y - pLo.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const bend = from === minN ? 1 : -1;
  const mx = (seg.x1 + seg.x2) / 2;
  const my = (seg.y1 + seg.y2) / 2;
  const cx = mx + px * BIDIRECTIONAL_CURVE * bend;
  const cy = my + py * BIDIRECTIONAL_CURVE * bend;
  return `M ${seg.x1} ${seg.y1} Q ${cx} ${cy} ${seg.x2} ${seg.y2}`;
}

export function MatchCycleGame({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const [seed, setSeed] = useState(() => HYDRATION_SAFE_INITIAL_SEED);
  const [vertexCount, setVertexCount] = useState(DEFAULT_VERTEX_COUNT);
  const [path, setPath] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"idle" | "success" | "fail">("idle");
  const graphRef = useRef<HTMLDivElement | null>(null);
  const shakeAnimationRef = useRef<Animation | null>(null);

  const stopGraphShake = useCallback(() => {
    shakeAnimationRef.current?.cancel();
    shakeAnimationRef.current = null;
  }, []);

  useEffect(() => () => stopGraphShake(), [stopGraphShake]);

  const puzzle = useMemo(
    () => generatePuzzle(seed, vertexCount),
    [seed, vertexCount],
  );
  const edgeSet = useMemo(() => buildEdgeSet(puzzle.edges), [puzzle.edges]);
  const positions = useMemo(() => nodePositions(puzzle.n), [puzzle.n]);

  /** Consecutive steps along the path; includes the closing edge when you click the start node again. */
  const highlightedEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i]!;
      const b = path[i + 1]!;
      if (edgeSet.has(edgeKey(a, b))) keys.add(edgeKey(a, b));
    }
    return keys;
  }, [path, edgeSet]);

  const edgesDrawOrder = useMemo(() => {
    return [...puzzle.edges].sort((a, b) => {
      const ha = highlightedEdgeKeys.has(edgeKey(a[0], a[1])) ? 1 : 0;
      const hb = highlightedEdgeKeys.has(edgeKey(b[0], b[1])) ? 1 : 0;
      return ha - hb;
    });
  }, [puzzle.edges, highlightedEdgeKeys]);

  const triggerInvalidShake = useCallback(() => {
    const el = graphRef.current;
    if (!el) return;
    stopGraphShake();
    shakeAnimationRef.current = el.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-18px)" },
        { transform: "translateX(18px)" },
        { transform: "translateX(-12px)" },
        { transform: "translateX(12px)" },
        { transform: "translateX(-6px)" },
        { transform: "translateX(0)" },
      ],
      {
        duration: SHAKE_MS,
        easing: "ease-in-out",
      },
    );
    shakeAnimationRef.current.onfinish = () => {
      shakeAnimationRef.current = null;
    };
  }, [stopGraphShake]);

  const appendNode = useCallback((id: number) => {
    setFeedback("idle");
    setPath((p) => {
      if (id === p[0] && p.length >= 3) return [...p, id];
      return [...p, id];
    });
  }, []);

  const undoLastStep = useCallback(() => {
    setFeedback("idle");
    stopGraphShake();
    setPath((p) => (p.length <= 1 ? [] : p.slice(0, -1)));
  }, [stopGraphShake]);

  const trySelectNode = useCallback(
    (id: number) => {
      if (path.length > 0 && id === path[path.length - 1]) {
        undoLastStep();
        return;
      }
      if (!canAppendToPath(path, id, edgeSet)) {
        triggerInvalidShake();
        return;
      }
      appendNode(id);
    },
    [path, edgeSet, appendNode, triggerInvalidShake, undoLastStep],
  );

  const removeAt = useCallback(
    (index: number) => {
      setFeedback("idle");
      stopGraphShake();
      setPath((p) => p.slice(0, index));
    },
    [stopGraphShake],
  );

  const clearPath = useCallback(() => {
    setFeedback("idle");
    stopGraphShake();
    setPath([]);
  }, [stopGraphShake]);

  const checkPath = useCallback(() => {
    if (isValidSimpleCycle(path, edgeSet)) {
      setFeedback("success");
    } else {
      setFeedback("fail");
    }
  }, [path, edgeSet]);

  const newPuzzle = useCallback(() => {
    stopGraphShake();
    setSeed(Date.now());
    setPath([]);
    setFeedback("idle");
  }, [stopGraphShake]);

  const updateVertexCount = useCallback(
    (nextCount: number) => {
      if (nextCount === vertexCount) return;
      stopGraphShake();
      setVertexCount(nextCount);
      setSeed(Date.now());
      setPath([]);
      setFeedback("idle");
    },
    [stopGraphShake, vertexCount],
  );

  const onNodeKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      trySelectNode(id);
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Match the cycle
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-xl">
            Follow outgoing arrows from the <strong>last</strong> node; bad
            picks shake, and clicking that node again undoes. Win with a{" "}
            <strong>simple cycle</strong> of{" "}
            <strong>&gt;= 3 distinct vertices</strong>.
          </p>
        </div>
      )}

      {embedded && (
        <p className="text-muted-foreground text-sm max-w-xl">
          Follow outgoing arrows from the <strong>last</strong> node; bad picks
          shake. Win with a <strong>simple cycle</strong> of{" "}
          <strong>&gt;= 3 distinct vertices</strong>.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Vertices:</span>
        {VERTEX_OPTIONS.map((count) => (
          <Button
            key={count}
            type="button"
            size="sm"
            variant={count === vertexCount ? "default" : "outline"}
            onClick={() => updateVertexCount(count)}
          >
            {count}
          </Button>
        ))}
      </div>

      <div className="rounded-lg border bg-card p-4 overflow-x-auto">
        <div className="flex justify-center">
          <div ref={graphRef} className="w-fit will-change-transform">
            <svg
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              className="block"
              aria-label="Directed graph puzzle"
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path
                    d="M0,0 L8,3 L0,6 z"
                    className="fill-muted-foreground"
                  />
                </marker>
                <marker
                  id="arrowhead-active"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <path d="M0,0 L8,3 L0,6 z" className="fill-accent" />
                </marker>
              </defs>

              {edgesDrawOrder.map(([from, to]) => {
                const p1 = positions[from]!;
                const p2 = positions[to]!;
                const d = edgeSvgD(edgeSet, from, to, p1, p2, positions);
                const active = highlightedEdgeKeys.has(edgeKey(from, to));
                return (
                  <path
                    key={`${from}-${to}`}
                    d={d}
                    fill="none"
                    className={active ? "stroke-accent" : "stroke-border"}
                    strokeWidth={EDGE_STROKE_WIDTH}
                    markerEnd={
                      active ? "url(#arrowhead-active)" : "url(#arrowhead)"
                    }
                  />
                );
              })}

              {Array.from({ length: puzzle.n }, (_, id) => {
                const { x, y } = positions[id]!;
                const inPath = path.includes(id);
                const isLast = path.length > 0 && path[path.length - 1] === id;
                return (
                  <g key={id} transform={`translate(${x}, ${y})`}>
                    <g
                      role="button"
                      tabIndex={0}
                      aria-label={`Node ${nodeLabel(id)}${inPath ? ", in path" : ""}`}
                      aria-pressed={inPath}
                      className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                      onClick={() => trySelectNode(id)}
                      onKeyDown={(e) => onNodeKeyDown(e, id)}
                    >
                      <circle
                        r={NODE_R}
                        className={cn(
                          "stroke-2 transition-colors",
                          isLast
                            ? "fill-accent/15 stroke-accent"
                            : inPath
                              ? "fill-accent stroke-accent-foreground"
                              : "fill-background stroke-border",
                        )}
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className={cn(
                          "text-sm font-semibold pointer-events-none select-none",
                          inPath && !isLast
                            ? "fill-accent-foreground"
                            : "fill-foreground",
                        )}
                        style={{ fontSize: 15 }}
                      >
                        {nodeLabel(id)}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 min-h-9">
          <span className="text-sm text-muted-foreground shrink-0">Path:</span>
          {path.length === 0 ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            path.map((id, index) => (
              <span
                key={`${id}-${index}`}
                className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-sm"
              >
                {nodeLabel(id)}
                <button
                  type="button"
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                  aria-label={`Remove ${nodeLabel(id)} from path`}
                  onClick={() => removeAt(index)}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={checkPath}>
            Check
          </Button>
          <Button type="button" variant="outline" onClick={clearPath}>
            Clear
          </Button>
          <Button type="button" variant="secondary" onClick={newPuzzle}>
            New puzzle
          </Button>
        </div>

        {feedback === "success" && (
          <p
            className="text-sm font-medium text-green-600 dark:text-green-500"
            role="status"
          >
            That&apos;s a valid cycle. Nice.
          </p>
        )}
        {feedback === "fail" && (
          <p className="text-sm text-red-700" role="status">
            Not a valid simple cycle yet — check arrows and that you don&apos;t
            repeat nodes.
          </p>
        )}
      </div>
    </div>
  );
}
