export type Puzzle = {
  n: number;
  edges: [number, number][];
};

export const MIN_VERTEX_COUNT = 4;
export const MAX_VERTEX_COUNT = 10;
export const DEFAULT_VERTEX_COUNT = 6;

export function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function edgeKey(from: number, to: number): string {
  return `${from},${to}`;
}

export function buildEdgeSet(edges: [number, number][]): Set<string> {
  return new Set(edges.map(([a, b]) => edgeKey(a, b)));
}

/**
 * Whether `nextId` may be appended to `path` (same rules as the game UI: empty path = any start;
 * re-click last = undo, handled before this; clicking the start again is just another step if the edge exists;
 * and 2-node ping-pong repeats like X→Y→X→Y are blocked after the first return.
 *
 * Examples:
 * - allowed: X→Y→X
 * - blocked: X→Y→X→Y
 */
export function canAppendToPath(
  path: number[],
  nextId: number,
  edgeSet: Set<string>,
): boolean {
  if (path.length === 0) return true;
  const last = path[path.length - 1]!;

  if (
    path.length >= 3 &&
    nextId === path[path.length - 2] &&
    last === path[path.length - 3]
  ) {
    return false;
  }

  if (nextId === path[0] && path.length >= 3) {
    return edgeSet.has(edgeKey(last, path[0]!));
  }
  return edgeSet.has(edgeKey(last, nextId));
}

/**
 * True when `path` is a simple directed cycle:
 * - **Open:** `[v0,…,v_{k-1}]` with k ≥ 3, all distinct, consecutive edges exist, and `v_{k-1}→v0` exists.
 * - **Closed:** `[v0,…,v_{k-1},v0]` with k ≥ 3 distinct vertices, consecutive edges exist (including last→v0).
 */
export function isValidSimpleCycle(
  path: number[],
  edgeSet: Set<string>,
): boolean {
  if (path.length < 3) return false;

  const explicitClose = path.length >= 4 && path[0] === path[path.length - 1];

  if (explicitClose) {
    const interior = path.slice(0, -1);
    if (interior.length < 3) return false;
    if (new Set(interior).size !== interior.length) return false;
    for (let i = 0; i < path.length - 1; i++) {
      if (!edgeSet.has(edgeKey(path[i]!, path[i + 1]!))) return false;
    }
    return true;
  }

  if (new Set(path).size !== path.length) return false;
  for (let i = 0; i < path.length - 1; i++) {
    if (!edgeSet.has(edgeKey(path[i]!, path[i + 1]!))) return false;
  }
  const last = path[path.length - 1]!;
  if (!edgeSet.has(edgeKey(last, path[0]!))) return false;
  return true;
}

function tryAddEdge(
  edgeSet: Set<string>,
  edges: [number, number][],
  from: number,
  to: number,
): void {
  if (from === to) return;
  const k = edgeKey(from, to);
  if (edgeSet.has(k)) return;
  edgeSet.add(k);
  edges.push([from, to]);
}

/**
 * Seeded directed graph: one Hamiltonian-style cycle on nodes 0..L-1 (L ∈ {4,5}),
 * optional extra nodes with spill edges, plus random distractors.
 */
export function generatePuzzle(
  seed: number,
  requestedCount = DEFAULT_VERTEX_COUNT,
): Puzzle {
  const rng = createRng(seed);
  const n = Math.max(
    MIN_VERTEX_COUNT,
    Math.min(MAX_VERTEX_COUNT, requestedCount),
  );
  const maxCycleLength = Math.min(n, 6);
  const minCycleLength = Math.min(3, maxCycleLength);
  const L =
    minCycleLength + Math.floor(rng() * (maxCycleLength - minCycleLength + 1));
  const order = Array.from({ length: L }, (_, i) => i);
  shuffleInPlace(order, rng);

  const edgeSet = new Set<string>();
  const edges: [number, number][] = [];

  for (let i = 0; i < L; i++) {
    const a = order[i]!;
    const b = order[(i + 1) % L]!;
    tryAddEdge(edgeSet, edges, a, b);
  }

  for (let e = L; e < n; e++) {
    const fromC = order[Math.floor(rng() * L)]!;
    tryAddEdge(edgeSet, edges, fromC, e);
    const toC = order[Math.floor(rng() * L)]!;
    tryAddEdge(edgeSet, edges, e, toC);
  }

  for (let t = 0; t < Math.max(10, n * 3); t++) {
    const from = Math.floor(rng() * n);
    const to = Math.floor(rng() * n);
    tryAddEdge(edgeSet, edges, from, to);
  }

  return { n, edges };
}

export function nodeLabel(index: number): string {
  return String.fromCharCode(65 + index);
}
