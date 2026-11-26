// Hex geometry for a pointy-top map in odd-r offset coordinates ({ c, r }: column, row; odd rows shift right),
// the layout of the v214 maps. Directions 0–5 run clockwise from east: 0 E, 1 SE, 2 SW, 3 W, 4 NW, 5 NE
// (screen y grows down). Unit facing uses the same numbers. Knows nothing about units or terrain.

/** Cube steps for directions 0–5. */
export const DIRECTIONS = Object.freeze([[1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1], [1, -1, 0]].map(Object.freeze));

export const key = h => `${h.c},${h.r}`;
export const fromKey = k => { const [c, r] = k.split(',').map(Number); return { c, r }; };
export const equals = (a, b) => a.c === b.c && a.r === b.r;

export function toCube({ c, r }) {
  const q = c - (r - (r & 1)) / 2;
  return { q, r, s: -q - r };
}

export function fromCube({ q, r }) {
  return { c: q + (r - (r & 1)) / 2, r };
}

export function distance(a, b) {
  const x = toCube(a), y = toCube(b);
  return (Math.abs(x.q - y.q) + Math.abs(x.r - y.r) + Math.abs(x.s - y.s)) / 2;
}

/** The hex one step away in direction d (0–5). Not bounded: the map decides what exists. */
export function neighbour(h, d) {
  const x = toCube(h), [dq, dr] = DIRECTIONS[((d % 6) + 6) % 6];
  return fromCube({ q: x.q + dq, r: x.r + dr });
}

/** The six neighbours, in direction order 0–5. */
export const neighbours = h => [0, 1, 2, 3, 4, 5].map(d => neighbour(h, d));

/** Is h inside a map of cols × rows? */
export const inside = (h, cols, rows) => h.c >= 0 && h.c < cols && h.r >= 0 && h.r < rows;

function roundCube(q, r, s) {
  let rq = Math.round(q), rr = Math.round(r), rs = Math.round(s);
  const dq = Math.abs(rq - q), dr = Math.abs(rr - r), ds = Math.abs(rs - s);
  if (dq > dr && dq > ds) rq = -rr - rs;
  else if (dr > ds) rr = -rq - rs;
  else rs = -rq - rr;
  return { q: rq, r: rr, s: rs };
}

/**
 * Hexes from a to b inclusive (cube interpolation). A line that runs exactly along an edge between two hexes takes
 * the same side every time (a tiny nudge), so line of sight is deterministic.
 */
export function line(a, b) {
  const n = distance(a, b), x = toCube(a), y = toCube(b);
  const e = 1e-6;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    out.push(fromCube(roundCube(x.q + e + (y.q - x.q) * t, x.r + e + (y.r - x.r) * t, x.s - 2 * e + (y.s - x.s) * t)));
  }
  return out;
}

/** Hexes at exactly `radius` from center (radius 0: the center). */
export function ring(center, radius) {
  if (radius === 0) return [{ ...center }];
  const out = [];
  let h = center;
  for (let i = 0; i < radius; i++) h = neighbour(h, 4);   // start north-west
  for (let side = 0; side < 6; side++) for (let i = 0; i < radius; i++) { out.push(h); h = neighbour(h, side); }
  return out;
}

/** Every hex within `radius` of center, nearest first. */
export function disk(center, radius) {
  const out = [];
  for (let k = 0; k <= radius; k++) out.push(...ring(center, k));
  return out;
}

/** Screen-space vector from a to b in hex-width units (x right, y down); used for angles only. */
function vector(a, b) {
  const x = toCube(a), y = toCube(b), dq = y.q - x.q, dr = y.r - x.r;
  return { x: Math.sqrt(3) * (dq + dr / 2), y: 1.5 * dr };
}

/** Angle from a to b in degrees, 0 = east, clockwise, in [0, 360). */
export function angle(a, b) {
  const v = vector(a, b);
  return ((Math.atan2(v.y, v.x) * 180) / Math.PI + 360) % 360;
}

/** The facing (0–5) closest to the direction from a to b; ties turn clockwise. */
export const direction = (a, b) => Math.round(angle(a, b) / 60 + 1e-9) % 6;

/** Smallest number of 60° steps between two facings (0–3). */
export function turnSteps(from, to) {
  const d = (((to - from) % 6) + 6) % 6;
  return Math.min(d, 6 - d);
}

/** Is target inside an arc of `arcDeg` degrees centred on `facing`, seen from origin? The origin hex is always inside. */
export function arcContains(origin, facing, arcDeg, target) {
  if (arcDeg >= 360 || equals(origin, target)) return true;
  const diff = Math.abs(((angle(origin, target) - facing * 60 + 540) % 360) - 180);
  return diff <= arcDeg / 2 + 1e-9;
}
