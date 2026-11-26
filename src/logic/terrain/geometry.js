// Map geometry for lines. Coordinates: x in hex columns (odd rows shifted half a hex), y in rows × √3/2, so the centre of
// hex (c, r) is (c + (r & 1) / 2, r · √3/2) and neighbouring centres are 1 apart. Map files write points as [x, row].
import { neighbour, inside, edgeKey } from '../hex/index.js';

const ROW = Math.sqrt(3) / 2;

export const hexCentre = ({ c, r }) => ({ x: c + (r & 1) / 2, y: r * ROW });
export const mapPoint = ([x, row]) => ({ x, y: row * ROW });

const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
const within = (p, q, r) => Math.min(p.x, r.x) - 1e-9 <= q.x && q.x <= Math.max(p.x, r.x) + 1e-9 && Math.min(p.y, r.y) - 1e-9 <= q.y && q.y <= Math.max(p.y, r.y) + 1e-9;

/** Do segments p1–p2 and q1–q2 touch or cross? */
export function segmentsCross(p1, p2, q1, q2) {
  const d1 = cross(q1, q2, p1), d2 = cross(q1, q2, p2), d3 = cross(p1, p2, q1), d4 = cross(p1, p2, q2);
  if (((d1 > 1e-12 && d2 < -1e-12) || (d1 < -1e-12 && d2 > 1e-12)) && ((d3 > 1e-12 && d4 < -1e-12) || (d3 < -1e-12 && d4 > 1e-12))) return true;
  return (Math.abs(d1) <= 1e-12 && within(q1, p1, q2)) || (Math.abs(d2) <= 1e-12 && within(q1, p2, q2))
    || (Math.abs(d3) <= 1e-12 && within(p1, q1, p2)) || (Math.abs(d4) <= 1e-12 && within(p1, q2, p2));
}

/**
 * Hex edges a polyline occupies: the edge between hexes P and Q when the line crosses the segment from P's centre to Q's.
 * points: [[x, row], …] → [{ edge: edgeKey, seg: index of the line segment }], each edge once (first segment wins).
 */
export function lineEdges(points, cols, rows) {
  const pts = points.map(mapPoint), out = new Map();
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const r0 = Math.max(0, Math.floor(Math.min(a.y, b.y) / ROW) - 1), r1 = Math.min(rows - 1, Math.ceil(Math.max(a.y, b.y) / ROW) + 1);
    const c0 = Math.max(0, Math.floor(Math.min(a.x, b.x)) - 1), c1 = Math.min(cols - 1, Math.ceil(Math.max(a.x, b.x)) + 1);
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const h = { c, r };
      for (let d = 0; d < 3; d++) {
        const n = neighbour(h, d);
        if (!inside(n, cols, rows)) continue;
        const k = edgeKey(h, d);
        if (!out.has(k) && segmentsCross(hexCentre(h), hexCentre(n), a, b)) out.set(k, i);
      }
    }
  }
  return [...out].map(([edge, seg]) => ({ edge, seg }));
}
