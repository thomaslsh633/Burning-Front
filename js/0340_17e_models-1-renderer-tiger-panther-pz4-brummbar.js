  // ══════════════════════════════════════════════════════════════
  // [17e] v104 — 2.5D sprite baker: tiny software z-buffer renderer + vehicle models (25, blueprint-based) + procedural infantry figures
  //     · procedural 3D mesh → shaded 24-direction sprites (hi + lo mip) using the SAME projection as the map
  //     · TankBaker is self-contained (no DOM except offscreen canvases); the game hooks it into drawUnitArt below
  // ══════════════════════════════════════════════════════════════
  const TankBaker = (() => {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const neg = a => [-a[0], -a[1], -a[2]];

    // ---------- mesh ----------
    class Mesh {
      constructor() { this.P = []; this.N = []; this.M = []; this.G = []; this.grp = 0; this.mats = []; }   // v182: G = per-triangle part group (1 = turret)
      mat(rgb, o) { this.mats.push(Object.assign({ c: rgb, spec: 0, dirt: 1, shadow: true, noise: 1 }, o || {})); return this.mats.length - 1; }
      tri(a, b, c, na, nb, nc, m) { this.P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); this.N.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]); this.M.push(m); this.G.push(this.grp ? 1 : 0); }
      // flat quad; normal flipped so it points away from `inside` (a point inside the solid)
      quad(a, b, c, d, m, inside) {
        let n = nrm(cross(sub(b, a), sub(d, a)));
        if (inside) { const cen = [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4]; if (dot(n, sub(cen, inside)) < 0) n = neg(n); }
        this.tri(a, b, c, n, n, n, m); this.tri(a, c, d, n, n, n, m);
      }
      box(x0, x1, y0, y1, z0, z1, m) {
        const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
        this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], m, c);
        this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], m, c);
        this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], m, c);
        this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], m, c);
        this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], m, c);
        this.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], m, c);
      }
      // p: 8 corners — bottom 4 (around), top 4 (same order)
      hex8(p, m) {
        const c = [0, 0, 0]; p.forEach(q => { c[0] += q[0] / 8; c[1] += q[1] / 8; c[2] += q[2] / 8; });
        this.quad(p[0], p[1], p[2], p[3], m, c); this.quad(p[4], p[5], p[6], p[7], m, c);
        for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(p[i], p[j], p[j + 4], p[i + 4], m, c); }
      }
      // surface of revolution. prof = [[t, r, mat?], …] traversed axis → outward → back to axis
      lathe(axis, o, prof, seg, defMat) {
        const AX = axis === 'x' ? [1, 0, 0] : axis === 'y' ? [0, 1, 0] : [0, 0, 1];
        const U = axis === 'x' ? [0, 1, 0] : axis === 'y' ? [0, 0, 1] : [1, 0, 0];
        const W = axis === 'x' ? [0, 0, 1] : axis === 'y' ? [1, 0, 0] : [0, 1, 0];
        const pos = (t, r, cs, sn) => [o[0] + AX[0] * t + (U[0] * cs + W[0] * sn) * r, o[1] + AX[1] * t + (U[1] * cs + W[1] * sn) * r, o[2] + AX[2] * t + (U[2] * cs + W[2] * sn) * r];
        const nor = (na, nr, cs, sn) => [AX[0] * na + (U[0] * cs + W[0] * sn) * nr, AX[1] * na + (U[1] * cs + W[1] * sn) * nr, AX[2] * na + (U[2] * cs + W[2] * sn) * nr];
        for (let i = 0; i < prof.length - 1; i++) {
          const t0 = prof[i][0], r0 = prof[i][1], t1 = prof[i + 1][0], r1 = prof[i + 1][1], m = prof[i + 1][2] === undefined ? defMat : prof[i + 1][2];
          const dt = t1 - t0, dr = r1 - r0, L = Math.hypot(dt, dr); if (L < 1e-9) continue;
          const na = -dr / L, nr = dt / L;
          for (let j = 0; j < seg; j++) {
            const a0 = j / seg * 6.283185307, a1 = (j + 1) / seg * 6.283185307, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
            const A = pos(t0, r0, c0, s0), B = pos(t1, r1, c0, s0), C = pos(t1, r1, c1, s1), D = pos(t0, r0, c1, s1);
            const n0 = nor(na, nr, c0, s0), n1 = nor(na, nr, c1, s1);
            this.tri(A, B, C, n0, n0, n1, m); this.tri(A, C, D, n0, n1, n1, m);
          }
        }
      }
      // convex polygon in XY extruded along Z; edges whose neighbours are < ~37° apart are smoothed
      prismXY(poly, z0, z1, m) {
        const n = poly.length; let cx = 0, cy = 0; poly.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
        const fn = poly.map((a, i) => { const b = poly[(i + 1) % n]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx * ((a[0] + b[0]) / 2 - cx) + ny * ((a[1] + b[1]) / 2 - cy) < 0) { nx = -nx; ny = -ny; } return [nx, ny]; });
        const vn = (i, e) => { const f0 = fn[(i - 1 + n) % n], f1 = fn[i]; if (f0[0] * f1[0] + f0[1] * f1[1] > 0.8) { const x = f0[0] + f1[0], y = f0[1] + f1[1], l = Math.hypot(x, y); return [x / l, y / l, 0]; } return [fn[e][0], fn[e][1], 0]; };
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, a = poly[i], b = poly[j], na = vn(i, i), nb = vn(j, i);
          this.tri([a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], na, nb, nb, m); this.tri([a[0], a[1], z0], [b[0], b[1], z1], [a[0], a[1], z1], na, nb, na, m);
          this.tri([cx, cy, z1], [a[0], a[1], z1], [b[0], b[1], z1], [0, 0, 1], [0, 0, 1], [0, 0, 1], m);
          this.tri([cx, cy, z0], [a[0], a[1], z0], [b[0], b[1], z0], [0, 0, -1], [0, 0, -1], [0, 0, -1], m);
        }
      }
      // rectangle in XY rotated by `ang`, extruded along Z
      rectZ(cx, cy, ang, len, wid, z0, z1, m) {
        const c = Math.cos(ang), s = Math.sin(ang), h = [[len / 2, wid / 2], [len / 2, -wid / 2], [-len / 2, -wid / 2], [-len / 2, wid / 2]];
        this.prismXY(h.map(([a, b]) => [cx + a * c - b * s, cy + a * s + b * c]), z0, z1, m);
      }
      // hollow loop (track belt): outer/inner = [[x,z],…] same length, extruded along Y
      belt(outer, inner, y0, y1, m) {
        const n = outer.length; let cx = 0, cz = 0; outer.forEach(p => { cx += p[0] / n; cz += p[1] / n; });
        const fn = outer.map((a, i) => { const b = outer[(i + 1) % n]; let nx = b[1] - a[1], nz = -(b[0] - a[0]); const l = Math.hypot(nx, nz) || 1; nx /= l; nz /= l; if (nx * ((a[0] + b[0]) / 2 - cx) + nz * ((a[1] + b[1]) / 2 - cz) < 0) { nx = -nx; nz = -nz; } return [nx, nz]; });
        const vn = (i, e) => { const f0 = fn[(i - 1 + n) % n], f1 = fn[i]; if (f0[0] * f1[0] + f0[1] * f1[1] > 0.8) { const x = f0[0] + f1[0], z = f0[1] + f1[1], l = Math.hypot(x, z); return [x / l, z / l]; } return fn[e]; };
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n, oa = outer[i], ob = outer[j], ia = inner[i], ib = inner[j];
          const na = vn(i, i), nb = vn(j, i);
          for (const [ya, yb] of [[y0, y1]]) {
            // outer wall
            this.tri([oa[0], ya, oa[1]], [ob[0], ya, ob[1]], [ob[0], yb, ob[1]], [na[0], 0, na[1]], [nb[0], 0, nb[1]], [nb[0], 0, nb[1]], m);
            this.tri([oa[0], ya, oa[1]], [ob[0], yb, ob[1]], [oa[0], yb, oa[1]], [na[0], 0, na[1]], [nb[0], 0, nb[1]], [na[0], 0, na[1]], m);
            // inner wall (faces the hollow)
            this.tri([ia[0], ya, ia[1]], [ib[0], ya, ib[1]], [ib[0], yb, ib[1]], [-na[0], 0, -na[1]], [-nb[0], 0, -nb[1]], [-nb[0], 0, -nb[1]], m);
            this.tri([ia[0], ya, ia[1]], [ib[0], yb, ib[1]], [ia[0], yb, ia[1]], [-na[0], 0, -na[1]], [-nb[0], 0, -nb[1]], [-na[0], 0, -na[1]], m);
          }
          // side faces (±Y)
          this.tri([oa[0], y0, oa[1]], [ob[0], y0, ob[1]], [ib[0], y0, ib[1]], [0, -1, 0], [0, -1, 0], [0, -1, 0], m); this.tri([oa[0], y0, oa[1]], [ib[0], y0, ib[1]], [ia[0], y0, ia[1]], [0, -1, 0], [0, -1, 0], [0, -1, 0], m);
          this.tri([oa[0], y1, oa[1]], [ob[0], y1, ob[1]], [ib[0], y1, ib[1]], [0, 1, 0], [0, 1, 0], [0, 1, 0], m); this.tri([oa[0], y1, oa[1]], [ib[0], y1, ib[1]], [ia[0], y1, ia[1]], [0, 1, 0], [0, 1, 0], [0, 1, 0], m);
        }
      }
    }

    // ---------- camera ----------
    // az = rotation of the world plane (the game's ANG); elev = camera elevation (sin = the game's TILT)
    function viewFor(az, elev) {
      const ca = Math.cos(az), sa = Math.sin(az), se = Math.sin(elev), ce = Math.cos(elev);
      return { a1: ca, a2: -sa, b1: sa * se, b2: ca * se, b3: ce, d1: sa * ce, d2: ca * ce, d3: se };
    }
    // light fixed relative to the camera: from the upper left, a little toward the viewer
    function lightFor(az) {
      const ca = Math.cos(az), sa = Math.sin(az), lr = -0.62, lv = 0.26, lz = 0.74;
      return nrm([lr * ca + lv * sa, -lr * sa + lv * ca, lz]);
    }

    // ---------- rasteriser ----------
    function raster(SC, nt, w, h, zb, idb, msk) {
      for (let t = 0; t < nt; t++) {
        if (msk && !msk[t]) continue;   // v182: part mask (hull-only / turret-only bake)
        const i = t * 9, x0 = SC[i], y0 = SC[i + 1], z0 = SC[i + 2], x1 = SC[i + 3], y1 = SC[i + 4], z1 = SC[i + 5], x2 = SC[i + 6], y2 = SC[i + 7], z2 = SC[i + 8];
        const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0); if (Math.abs(area) < 1e-7) continue; const inv = 1 / area;
        const xa = Math.max(0, Math.floor(Math.min(x0, x1, x2) - .5)), xb = Math.min(w - 1, Math.ceil(Math.max(x0, x1, x2) + .5));
        const ya = Math.max(0, Math.floor(Math.min(y0, y1, y2) - .5)), yb = Math.min(h - 1, Math.ceil(Math.max(y0, y1, y2) + .5));
        for (let y = ya; y <= yb; y++) {
          const py = y + .5;
          for (let x = xa; x <= xb; x++) {
            const px = x + .5;
            const w0 = ((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py)) * inv, w1 = ((x2 - px) * (y0 - py) - (x0 - px) * (y2 - py)) * inv, w2 = 1 - w0 - w1;
            if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
            const z = w0 * z0 + w1 * z1 + w2 * z2, k = y * w + x;
            if (z > zb[k]) { zb[k] = z; if (idb) idb[k] = t; }
          }
        }
      }
    }
    const hash = (x, y, z) => { let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
    const vnoise = (x, y, z) => {
      const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
      const l = (a, b, t) => a + (b - a) * t;
      return l(l(l(hash(ix, iy, iz), hash(ix + 1, iy, iz), sx), l(hash(ix, iy + 1, iz), hash(ix + 1, iy + 1, iz), sx), sy), l(l(hash(ix, iy, iz + 1), hash(ix + 1, iy, iz + 1), sx), l(hash(ix, iy + 1, iz + 1), hash(ix + 1, iy + 1, iz + 1), sx), sy), sz);
    };

    // o = { yaw, X0, S (px per metre), ss, W, H, px, py, view, L }
    function renderMesh(mesh, o) {
      const { yaw, X0, S, ss, W, H, px, py, view } = o, L = o.L, BW = W * ss, BH = H * ss, SB = S * ss, c = Math.cos(yaw), s = Math.sin(yaw), nt = mesh.M.length;
      const SC = new Float32Array(nt * 9), WP = new Float32Array(nt * 9), WN = new Float32Array(nt * 9);
      for (let t = 0; t < nt; t++) for (let k = 0; k < 3; k++) {
        const i = t * 9 + k * 3, X = mesh.P[i], Y = mesh.P[i + 1], Z = mesh.P[i + 2], lx = X - X0, ly = -Y;
        const wx = lx * c - ly * s, wy = lx * s + ly * c;
        WP[i] = wx; WP[i + 1] = wy; WP[i + 2] = Z;
        const nx = mesh.N[i], ny = -mesh.N[i + 1], nz = mesh.N[i + 2];
        WN[i] = nx * c - ny * s; WN[i + 1] = nx * s + ny * c; WN[i + 2] = nz;
        SC[i] = (view.a1 * wx + view.a2 * wy) * SB + px * ss; SC[i + 1] = (view.b1 * wx + view.b2 * wy - view.b3 * Z) * SB + py * ss; SC[i + 2] = view.d1 * wx + view.d2 * wy + view.d3 * Z;
      }
      const zb = new Float32Array(BW * BH).fill(-1e9), idb = new Int32Array(BW * BH).fill(-1);
      const msk = o.part && mesh.G && mesh.G.length === nt ? Uint8Array.from(mesh.G, g => (o.part === 'turret') === !!g ? 1 : 0) : null;   // v182: o.part 'hull' | 'turret'
      raster(SC, nt, BW, BH, zb, idb, msk);

      // shadow map (orthographic along the light)
      const up = Math.abs(L[2]) > .95 ? [1, 0, 0] : [0, 0, 1], e1 = nrm(cross(L, up)), e2 = cross(L, e1), SL = new Float32Array(nt * 9);
      let mn1 = 1e9, mx1 = -1e9, mn2 = 1e9, mx2 = -1e9;
      for (let v = 0; v < nt * 3; v++) { const i = v * 3, p = [WP[i], WP[i + 1], WP[i + 2]], a = dot(p, e1), b = dot(p, e2); mn1 = Math.min(mn1, a); mx1 = Math.max(mx1, a); mn2 = Math.min(mn2, b); mx2 = Math.max(mx2, b); }
      const SW = Math.ceil((mx1 - mn1) * SB) + 4, SH = Math.ceil((mx2 - mn2) * SB) + 4;
      for (let v = 0; v < nt * 3; v++) { const i = v * 3, p = [WP[i], WP[i + 1], WP[i + 2]]; SL[i] = (dot(p, e1) - mn1) * SB + 2; SL[i + 1] = (dot(p, e2) - mn2) * SB + 2; SL[i + 2] = dot(p, L); }
      const sm = new Float32Array(SW * SH).fill(-1e9); raster(SL, nt, SW, SH, sm, null);

      // shade
      const V = nrm([view.d1, view.d2, view.d3]), Hh = nrm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]), img = new Uint8ClampedArray(BW * BH * 4), cov = new Uint8Array(BW * BH);
      for (let k = 0; k < BW * BH; k++) {
        const t = idb[k]; if (t < 0) continue; cov[k] = 1;
        const i = t * 9, x0 = SC[i], y0 = SC[i + 1], x1 = SC[i + 3], y1 = SC[i + 4], x2 = SC[i + 6], y2 = SC[i + 7];
        const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0), inv = 1 / area, X = k % BW + .5, Y = (k / BW | 0) + .5;
        const w0 = ((x1 - X) * (y2 - Y) - (x2 - X) * (y1 - Y)) * inv, w1 = ((x2 - X) * (y0 - Y) - (x0 - X) * (y2 - Y)) * inv, w2 = 1 - w0 - w1;
        let nx = w0 * WN[i] + w1 * WN[i + 3] + w2 * WN[i + 6], ny = w0 * WN[i + 1] + w1 * WN[i + 4] + w2 * WN[i + 7], nz = w0 * WN[i + 2] + w1 * WN[i + 5] + w2 * WN[i + 8];
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        if (nx * V[0] + ny * V[1] + nz * V[2] < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const wx = w0 * WP[i] + w1 * WP[i + 3] + w2 * WP[i + 6], wy = w0 * WP[i + 1] + w1 * WP[i + 4] + w2 * WP[i + 7], wz = w0 * WP[i + 2] + w1 * WP[i + 5] + w2 * WP[i + 8];
        const m = mesh.mats[mesh.M[t]];
        // model-space position (for noise / dirt)
        const mlx = wx * c + wy * s, mly = -wx * s + wy * c, mX = mlx + X0, mY = -mly;
        // shadow lookup (3×3 PCF)
        const lsx = ((wx * e1[0] + wy * e1[1] + wz * e1[2]) - mn1) * SB + 2, lsy = ((wx * e2[0] + wy * e2[1] + wz * e2[2]) - mn2) * SB + 2, ld = wx * L[0] + wy * L[1] + wz * L[2];
        const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), bias = .035 + .07 * (1 - ndl);
        let lit = 0, cnt = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const sx = (lsx | 0) + dx, sy = (lsy | 0) + dy; if (sx < 0 || sy < 0 || sx >= SW || sy >= SH) { lit++; cnt++; continue; } cnt++; if (sm[sy * SW + sx] <= ld + bias) lit++; }
        const vis = m.recv === false ? 1 : lit / cnt, diff = ndl * vis;                     // recv:false → material ignores cast shadows (faces under helmet brims)
        const hemi = .5 + .5 * nz, ar = .30 + .26 * hemi, ag = .31 + .29 * hemi, ab = .32 + .36 * hemi;
        // base colour: noise + dirt near the ground
        let r = m.c[0], g = m.c[1], b = m.c[2];
        const nz1 = (vnoise(mX * 7, mY * 7, wz * 7) - .5) * .20 + (vnoise(mX * 23, mY * 23, wz * 23) - .5) * .12;
        const f = 1 + nz1 * m.noise; r *= f; g *= f; b *= f;
        const dirt = Math.max(0, Math.min(1, (.95 - wz) / .95)) * .42 * m.dirt;
        r += (92 - r) * dirt; g += (78 - g) * dirt; b += (60 - b) * dirt;
        const sp = m.spec ? Math.pow(Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), 28) * m.spec * vis : 0;
        const lr = ar + diff * .98, lg = ag + diff * .91, lb = ab + diff * .80;
        const o4 = k * 4;
        img[o4] = r * lr + sp * 255; img[o4 + 1] = g * lg + sp * 250; img[o4 + 2] = b * lb + sp * 240; img[o4 + 3] = 255;
      }
      // screen-space AO + inner depth edges
      const R = Math.max(2, Math.round(.20 * SB)), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [.7, .7], [-.7, .7], [.7, -.7], [-.7, -.7]], ed = Math.max(1, Math.round(.045 * SB));
      for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
        const k = y * BW + x; if (!cov[k]) continue; const z = zb[k]; let occ = 0, edge = 0;
        for (const [dx, dy] of dirs) {
          const xx = Math.round(x + dx * R), yy = Math.round(y + dy * R); if (xx < 0 || yy < 0 || xx >= BW || yy >= BH) continue;
          const dz = zb[yy * BW + xx] - z; if (dz > .03 && dz < .9) occ += Math.min(1, dz / .35);
          const xe = Math.round(x + dx * ed), ye = Math.round(y + dy * ed); if (xe >= 0 && ye >= 0 && xe < BW && ye < BH && cov[ye * BW + xe] && z - zb[ye * BW + xe] > .16) edge = 1;
        }
        if (mesh.mats[mesh.M[idb[k]]].recv === false) continue;                              // recv:false materials (skin) skip AO / inner edges too
        const ao = 1 - .5 * occ / 8 * 2.0, k4 = k * 4, fct = Math.max(.35, ao) * (edge ? .6 : 1);
        img[k4] *= fct; img[k4 + 1] *= fct; img[k4 + 2] *= fct;
      }
      // silhouette outline
      const ow = o.outline === undefined ? 2 : o.outline;
      if (ow > 0) {
        let cur = cov;
        for (let it = 0; it < ow; it++) {
          const nxt = new Uint8Array(cur);
          for (let y = 1; y < BH - 1; y++) for (let x = 1; x < BW - 1; x++) { const k = y * BW + x; if (cur[k]) continue; if (cur[k - 1] || cur[k + 1] || cur[k - BW] || cur[k + BW]) { nxt[k] = 2; const k4 = k * 4; img[k4] = 16; img[k4 + 1] = 18; img[k4 + 2] = 22; img[k4 + 3] = 215; } }
          cur = nxt.map(v => v ? 1 : 0);
        }
      }
      return { img, BW, BH, WP, nt, L };
    }

    // ---------- bake one direction into a cell canvas ----------
    function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function bakeCell(mesh, o) {
      const { img, BW, BH, WP, nt, L } = renderMesh(mesh, o), W = o.W, H = o.H, ss = o.ss, S = o.S, view = o.view;
      const big = mkCanvas(BW, BH); big.getContext('2d').putImageData(new ImageData(img, BW, BH), 0, 0);
      const out = mkCanvas(W, H), ctx = out.getContext('2d');
      // ground shadow: project casting triangles to z = 0 along the light, fill the union, blur by down/up-scaling
      if (o.shadow !== false) {
        const sh = mkCanvas(W, H), sc = sh.getContext('2d'); sc.fillStyle = '#000'; sc.lineJoin = 'round';
        const gx = (wx, wy) => (view.a1 * wx + view.a2 * wy) * S + o.px, gy = (wx, wy) => (view.b1 * wx + view.b2 * wy) * S + o.py;
        for (let t = 0; t < nt; t++) {
          if (!mesh.mats[mesh.M[t]].shadow) continue; const i = t * 9; sc.beginPath();
          for (let k = 0; k < 3; k++) { const wx = WP[i + k * 3], wy = WP[i + k * 3 + 1], wz = WP[i + k * 3 + 2], q = wz / L[2], X = wx - L[0] * q, Y = wy - L[1] * q; k ? sc.lineTo(gx(X, Y), gy(X, Y)) : sc.moveTo(gx(X, Y), gy(X, Y)); }
          sc.closePath(); sc.fill(); sc.lineWidth = 2.2; sc.strokeStyle = '#000'; sc.stroke();
        }
        const sm = mkCanvas(Math.max(1, W >> 2), Math.max(1, H >> 2)), smc = sm.getContext('2d'); smc.imageSmoothingEnabled = true; smc.drawImage(sh, 0, 0, sm.width, sm.height);
        ctx.imageSmoothingEnabled = true; ctx.globalAlpha = .46; ctx.drawImage(sm, 0, 0, W, H); ctx.globalAlpha = .22; ctx.drawImage(sh, 0, 0); ctx.globalAlpha = 1;
      }
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(big, 0, 0, W, H);
      const rim = o.rim !== undefined ? o.rim : (o.shadow === false ? 0 : .32);                    // v107: sky rim — model alpha minus itself shifted down = top edges
      if (rim > 0) {
        const rc = mkCanvas(W, H), rg = rc.getContext('2d'), d = Math.max(1, Math.round(S / 20));
        rg.imageSmoothingEnabled = true; rg.drawImage(big, 0, 0, W, H); rg.globalCompositeOperation = 'destination-out'; rg.drawImage(big, 0, d, W, H);
        rg.globalCompositeOperation = 'source-in'; rg.fillStyle = '#fff7e6'; rg.fillRect(0, 0, W, H);
        ctx.globalAlpha = rim; ctx.drawImage(rc, 0, 0); ctx.globalAlpha = 1;
      }
      return out;
    }

    // ---------- Tiger I model (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v64: rebuilt from the Tiger I H1 plan drawing (side / top / front views measured in metres).
    //      Only the large silhouette + structure is modelled; small fittings are intentionally left out.
    const PAINT = {
      // Wehrmacht Panzergrau (dark grey, RAL 7021 family) — albedo values, the baker's lighting brightens them ~1.25×
      // v107: both desaturated — German a cool grey, US olive drab pulled toward khaki
      grey: { hull: [101, 106, 112], dark: [68, 72, 77], gun: [72, 76, 81], wheel: [94, 99, 104] },
      olive: { hull: [110, 110, 82], dark: [78, 79, 60], gun: [70, 72, 56], wheel: [100, 100, 76] }
    };
    function buildTiger(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.87, HW = 1.60, XF = 2.34, XR = -2.71;   // deck height, hull half-width, superstructure front / rear

      // ---- hull ----
      M.box(XR, XF, -HW, HW, 1.00, DZ, hull);                                   // upper hull (superstructure)
      M.box(-3.08, XR, -1.55, 1.55, .78, 1.90, hull);                            // rear plate section
      M.hex8([[-2.60, -1.08, .39], [2.55, -1.08, .39], [2.55, 1.08, .39], [-2.60, 1.08, .39],   // lower hull between the tracks + sloped nose
              [-2.60, -1.08, 1.05], [3.08, -1.08, 1.30], [3.08, 1.08, 1.30], [-2.60, 1.08, 1.05]], hull);
      M.box(XF, 3.13, -1.86, 1.86, 1.25, 1.32, hull);                            // front deck / mudguard wings (full width)
      for (const sy of [-1, 1]) {
        const a = sy > 0 ? HW : -1.86, b = sy > 0 ? 1.86 : -HW;
        M.box(-2.70, XF, a, b, 1.28, 1.34, hull);                                // side fenders
        M.box(-2.60, 2.30, sy > 0 ? 1.82 : -1.86, sy > 0 ? 1.86 : -1.82, 1.04, 1.30, dark);   // fender side lip
      }
      // front plate fittings: driver visor (left), bow MG ball (right)
      M.box(XF, XF + .13, .17, .85, 1.45, 1.67, dark); M.box(XF + .12, XF + .14, .30, .72, 1.52, 1.60, glass);
      L('x', [XF, -.56, 1.52], [[0, 0], [0, .18], [.09, .18], [.09, 0]], 14, dark); L('x', [XF + .09, -.56, 1.52], [[0, 0], [0, .03], [.30, .03], [.30, 0]], 8, gun);
      // driver / radio-operator hatches, engine deck, grilles, air cleaners
      for (const sy of [-1, 1]) L('z', [1.76, sy * .85, DZ], [[0, 0], [0, .27], [.06, .27], [.06, 0]], 20, dark);
      M.box(-2.68, -1.00, -1.50, 1.50, DZ, DZ + .03, dark);
      for (const sy of [-1, 1]) M.box(-2.60, -1.10, sy > 0 ? .62 : -1.42, sy > 0 ? 1.42 : -.62, DZ + .03, DZ + .06, grille);
      L('z', [-1.78, 0, DZ + .03], [[0, 0], [0, .26], [.10, .22], [.10, 0]], 18, hull);
      L('z', [-2.52, .12, DZ + .03], [[0, 0], [0, .17], [.08, .15], [.08, 0]], 14, hull);
      // rear mufflers (two pots per side)
      for (const sy of [-1, 1]) for (const yy of [1.10, 1.45]) L('z', [-2.92, sy * yy, 1.52], [[0, 0], [0, .19], [.44, .19], [.44, 0]], 14, dark);

      // ---- turret ----
      const GZ = 2.20, RZ = 2.61, FZ = 2.50;                                       // gun axis, roof height (rear), roof height at the front edge
      // roof outline measured from the plan view: right half (+Y mirrored), front → rear; front plate is flat, rear is a rounded-square
      const half = [[1.36, .86], [1.10, .99], [.77, 1.11], [.45, 1.18], [.13, 1.22], [-.20, 1.20], [-.46, 1.14], [-.64, 1.04], [-.77, .88], [-.87, .70], [-.95, .52], [-1.00, .26], [-1.02, 0]];
      const tp = half.map(([x, y]) => [x, -y]).concat(half.slice(0, -1).reverse());
      L('z', [-.10, 0, DZ - .02], [[0, 0], [0, 1.02], [.15, 1.02], [.15, 0]], 28, dark);   // turret ring
      M.prismXY(tp, 2.00, FZ, hull);                                               // turret body up to the low front roof line
      M.prismXY(tp.filter(p => p[0] <= .45), FZ, RZ, hull);                        // rear roof (full height)
      M.hex8([[1.10, -.99, FZ], [1.10, .99, FZ], [.45, 1.18, FZ], [.45, -1.18, FZ], [1.10, -.99, FZ + .02], [1.10, .99, FZ + .02], [.45, 1.18, RZ], [.45, -1.18, RZ]], hull);   // sloped front roof
      // rear bulge: full-height arc-shaped box that sticks out behind the turret (to X = −1.42)
      M.prismXY([[-.90, -.74], [-1.10, -.64], [-1.28, -.48], [-1.39, -.26], [-1.42, 0], [-1.39, .26], [-1.28, .48], [-1.10, .64], [-.90, .74]], 1.98, RZ - .03, hull);
      // angular gun mantlet: tapered box on the front plate (0.86 × 0.50 m at the plate → 0.48 × 0.36 m at the sleeve)
      M.hex8([[1.30, -.43, 1.95], [1.30, .43, 1.95], [1.30, .43, 2.45], [1.30, -.43, 2.45], [1.66, -.24, 2.03], [1.66, .24, 2.03], [1.66, .24, 2.39], [1.66, -.24, 2.39]], hull);
      // three-stage 88 mm barrel: thick sleeve Ø.37 (X 1.68–2.30) → mid Ø.24 (to 3.14) → thin Ø.17 (to the muzzle brake at 4.89)
      L('x', [1.62, 0, GZ], [[0, 0], [0, .22], [.06, .22], [.06, .185], [.68, .185], [.74, .12], [1.52, .12], [1.58, .084], [3.27, .084], [3.27, 0]], 20, gun);
      L('x', [4.89, 0, GZ], [[0, 0], [0, .075], [.04, .116], [.38, .116], [.42, .07], [.42, 0]], 14, gun);
      // commander cupola (left rear), loader hatch (right rear), vent
      L('z', [-.26, .42, RZ], [[0, 0], [0, .45], [.22, .45], [.22, .40], [.27, .40], [.27, 0]], 22, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(-.26 + .36 * Math.cos(a), .42 + .36 * Math.sin(a), a, .05, .12, RZ + .22, RZ + .30, glass); }
      L('z', [-.26, .42, RZ + .22], [[0, 0], [0, .28], [.04, .28], [.04, 0]], 16, hull);
      M.box(-.24, .18, -1.02, -.48, RZ, RZ + .06, dark);
      L('z', [-.53, -.58, RZ], [[0, 0], [0, .10], [.05, .10], [.05, 0]], 12, dark);
      // smoke dischargers on the turret front corners
      for (const sy of [-1, 1]) for (let k = 0; k < 3; k++) L('z', [.80 + k * .10, sy * 1.14, 2.20], [[0, 0], [0, .035], [.30, .035], [.30, 0]], 8, dark);

      // ---- tracks & running gear ----
      const C1 = [2.66, .78], R1 = .47, C2 = [-2.32, .62], R2 = .38, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .62, 12);       // sprocket, clockwise over the front
      pts.push([2.25, 0], [-2.10, 0]);                      // flat ground run
      arc(C2, R2, -Math.PI * .44, -Math.PI * 1.5, 10);    // idler, up around the rear
      pts.push([0, 1.00], [2.00, 1.06]);                    // top run back to the sprocket
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .55], thick = .09, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.10 : -1.86, yb = sy > 0 ? 1.86 : -1.10, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                       // link ridges along the outer surface
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .14)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        // 8 axles, 0.512 m pitch: even axles carry the outer wheel row, odd axles the (partly hidden) inner row
        const RW = .40, WZ = .50;
        for (let k = 0; k < 8; k++) {
          const x = 1.98 - .512 * k, yc = sy * (k % 2 === 0 ? 1.73 : 1.50);
          L('y', [x, yc, WZ], [[-.07 * f, 0], [-.07 * f, RW, wheel], [.04 * f, RW, tyre], [.04 * f, RW - .09, tyre], [.06 * f, RW - .10, wheel], [.035 * f, .24, wheel], [.035 * f, .12, wheel], [.078 * f, .12, wheel], [.078 * f, 0, wheel]], 22, wheel);
        }
        // drive sprocket (front) and idler (rear)
        L('y', [C1[0], sy * 1.52, C1[1]], [[-.08 * f, 0], [-.08 * f, .43, wheel], [.05 * f, .43, wheel], [.05 * f, .37, dark], [.07 * f, .37, wheel], [.07 * f, .15, wheel], [.10 * f, .15, wheel], [.10 * f, 0, wheel]], 22, wheel);
        for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; L('y', [C1[0] + .27 * Math.cos(a), sy * 1.52, C1[1] + .27 * Math.sin(a)], [[.06 * f, 0], [.06 * f, .04, dark], [.075 * f, .04, dark], [.075 * f, 0, dark]], 8, dark); }
        L('y', [C2[0], sy * 1.50, C2[1]], [[-.08 * f, 0], [-.08 * f, .34, wheel], [.04 * f, .34, wheel], [.04 * f, .28, dark], [.06 * f, .28, wheel], [.06 * f, .10, wheel], [.09 * f, .10, wheel], [.09 * f, 0, wheel]], 20, wheel);
      }
      return M;
    }

    // ---------- Panther Ausf. G model (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v66: measured from the Panther G plan drawing (side / top / front views, 20-ft scale bar → 52.99 px/m).
    //      Large silhouette + structure only (skirts, sloped glacis, Saukopf mantlet, KwK 42 L/70) .
    // convex polygon loft in XY: A at z0 → B at z1 (same vertex count)
    function loftXY(M, A, B, z0, z1, m) {
      const n = A.length, c = [0, 0, (z0 + z1) / 2]; A.forEach(p => { c[0] += p[0] / n; c[1] += p[1] / n; });
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.quad([A[i][0], A[i][1], z0], [A[j][0], A[j][1], z0], [B[j][0], B[j][1], z1], [B[i][0], B[i][1], z1], m, c); }
      let cx = 0, cy = 0; B.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([cx, cy, z1], [B[i][0], B[i][1], z1], [B[j][0], B[j][1], z1], [0, 0, 1], [0, 0, 1], [0, 0, 1], m); }
    }
    // convex polygon in XZ (side profile) extruded along Y
    function extrudeXZ(M, poly, y0, y1, m) {
      const n = poly.length, c = [0, (y0 + y1) / 2, 0]; poly.forEach(p => { c[0] += p[0] / n; c[2] += p[1] / n; });
      for (let i = 0; i < n; i++) { const j = (i + 1) % n, a = poly[i], b = poly[j]; M.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], m, c); }
      for (const [y, ny] of [[y0, -1], [y1, 1]]) for (let i = 0; i < n; i++) { const j = (i + 1) % n; M.tri([c[0], y, c[2]], [poly[i][0], y, poly[i][1]], [poly[j][0], y, poly[j][1]], [0, ny, 0], [0, ny, 0], [0, ny, 0], m); }
    }
    function buildPanther(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const DZ = 1.95, SK = 1.62;                       // deck height, outer face of the side skirts (Schürzen)

      // ---- hull ----
      M.hex8([[-2.85, -.92, .52], [2.88, -.92, .52], [2.88, .92, .52], [-2.85, .92, .52],       // lower hull tub between the tracks + sloped lower nose
              [-2.92, -.92, 1.05], [3.12, -.92, 1.05], [3.12, .92, 1.05], [-2.92, .92, 1.05]], hull);
      M.box(-2.88, 2.00, -SK + .04, SK - .04, .85, 1.50, dark);                                               // sponson block carrying the skirts (skirt = outer face)
      loftXY(M, [[-3.00, -1.62], [2.00, -1.62], [2.00, 1.62], [-3.00, 1.62]], [[-3.00, -1.30], [2.00, -1.30], [2.00, 1.30], [-3.00, 1.30]], 1.50, DZ, hull);   // sloped superstructure: 1.62 m half-width at Z 1.5 → 1.30 m at the deck
      // sloped glacis: from the nose edge (3.12, Z 1.05) up to the deck edge (2.00, Z 1.95); 1.9 m wide at the nose, 2.6 m at the top
      M.hex8([[3.12, -1.0, 1.02], [3.12, 1.0, 1.02], [2.00, 1.0, 1.02], [2.00, -1.0, 1.02],
              [3.10, -1.0, 1.07], [3.10, 1.0, 1.07], [2.00, 1.0, DZ], [2.00, -1.0, DZ]], hull);
      // upper front plate: sloped trapezoid — 2.6 m wide at the deck edge (Z 1.95), 3.24 m wide at Z 1.5, following the sloped superstructure sides
      M.hex8([[2.54, -1.62, 1.44], [2.54, 1.62, 1.44], [2.00, 1.62, 1.44], [2.00, -1.62, 1.44],
              [2.54, -1.62, 1.50], [2.54, 1.62, 1.50], [2.00, 1.30, DZ], [2.00, -1.30, DZ]], hull);
      M.box(2.0, 3.0, .88, 1.02, .85, 1.50, dark); M.box(2.0, 3.0, -1.02, -.88, .85, 1.50, dark);   // fills the space between nose plate and front track
      // front mudguards: curved at the front, flat at Z 1.5 (X 2.0 … 3.33)
      const fend = [[3.33, 1.00], [3.31, 1.22], [3.20, 1.40], [3.02, 1.50], [2.00, 1.50], [2.00, 1.00]];
      extrudeXZ(M, fend, .85, SK, hull); extrudeXZ(M, fend, -SK, -.85, hull);
      // side skirts (Schürzen): 6 separate rectangular plates per side hanging from a top rail; dark gaps between them
      for (const sy of [-1, 1]) {
        const x0 = -2.88, x1 = 2.93, gap = .04, w = (x1 - x0 - 5 * gap) / 6, ya = sy > 0 ? SK - .045 : -SK, yb = sy > 0 ? SK : -SK + .045;
        for (let k = 0; k < 6; k++) { const a = x0 + k * (w + gap); M.box(a, a + w, ya, yb, .85, 1.46, hull); }
        M.box(x0, x1, sy > 0 ? SK - .08 : -SK, sy > 0 ? SK : -SK + .08, 1.46, 1.52, hull);   // rail
        M.box(2.00, 2.93, sy > 0 ? .85 : -SK + .04, sy > 0 ? SK - .04 : -.85, .85, 1.02, dark);   // front end behind the first plate
      }
      // rear: muffler boxes + tail plate
      for (const sy of [-1, 1]) M.box(-3.38, -3.00, sy > 0 ? .62 : -1.18, sy > 0 ? 1.18 : -.62, 1.50, 1.90, dark);
      M.hex8([[-2.90, -1.30, 1.00], [-2.88, -1.30, 1.00], [-2.88, 1.30, 1.00], [-2.90, 1.30, 1.00], [-3.06, -1.30, 1.50], [-2.88, -1.30, 1.50], [-2.88, 1.30, 1.50], [-3.06, 1.30, 1.50]], hull);   // sloped tail plate
      // engine deck: two fan discs, four air-intake grilles
      for (const sy of [-1, 1]) {
        L('z', [-2.00, sy * .93, DZ], [[0, 0], [0, .31], [.025, .31], [.025, 0]], 22, grille);
        for (const [x0, x1] of [[-3.00, -2.60], [-1.55, -1.16]]) M.box(x0, x1, sy > 0 ? .57 : -1.17, sy > 0 ? 1.17 : -.57, DZ, DZ + .03, grille);
        L('z', [1.55, sy * .55, DZ], [[0, 0], [0, .20], [.05, .20], [.05, 0]], 18, dark);        // driver / radio-operator hatches (on the glacis top edge)
      }
      // spare track links on the rear hull sides (3 stacks per side, Z 1.55 … 1.95)
      for (const sy of [-1, 1]) for (const [x0, x1] of [[-2.04, -1.58], [-2.54, -2.10], [-2.98, -2.58]]) M.box(x0, x1, sy > 0 ? 1.45 : -1.67, sy > 0 ? 1.67 : -1.45, 1.55, 1.95, trkR);

      // ---- turret (Panther G: sloped sides, 78° front plate with Saukopf mantlet) ----
      const RZ = 2.79, GZ = 2.37;
      const bh = [[.93, 0], [.93, 1.02], [-.45, 1.19], [-1.04, .92], [-1.36, .74], [-1.48, .45], [-1.48, 0]];
      const rh = [[.70, 0], [.70, .72], [-.45, .86], [-.80, .68], [-1.07, .50], [-1.07, .42], [-1.07, 0]];
      const full = h => h.map(([x, y]) => [x, -y]).concat(h.slice(1, -1).reverse());
      loftXY(M, full(bh), full(rh), DZ, RZ, hull);
      // Saukopf mantlet (side profile, 1.5 m wide) + barrel collar + KwK 42 L/70 (3 diameters) + double-baffle muzzle brake
      extrudeXZ(M, [[.72, 2.78], [1.05, 2.68], [1.28, 2.55], [1.34, 2.38], [1.28, 2.20], [1.12, 2.06], [.95, 2.02], [.84, 2.02]], -.76, .76, hull);
      L('x', [1.30, 0, GZ], [[0, 0], [0, .105], [3.70, .082], [3.74, .112], [4.05, .112], [4.05, 0]], 24, gun);   // one long tube tapering to the muzzle brake (no steps)
      // commander cupola (left rear) + vision slits, loader hatch (right)
      L('z', [-.62, .40, RZ], [[0, 0], [0, .40], [.10, .40], [.12, .35], [.20, .35], [.20, 0]], 22, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(-.62 + .30 * Math.cos(a), .40 + .30 * Math.sin(a), a, .05, .10, RZ + .09, RZ + .17, glass); }
      L('z', [-.62, .40, RZ + .20], [[0, 0], [0, .24], [.04, .24], [.04, 0]], 16, hull);
      L('z', [-.15, -.45, RZ], [[0, 0], [0, .26], [.05, .26], [.05, 0]], 16, dark);
      L('z', [-.30, .20, RZ], [[0, 0], [0, .09], [.05, .09], [.05, 0]], 12, dark);

      // ---- tracks & running gear ----
      const C1 = [2.80, .72], R1 = .42, C2 = [-2.48, .72], R2 = .38, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .28, 12);        // sprocket: over the top and the front
      pts.push([2.24, .03], [-2.10, .03]);                  // inclined run to the ground, flat ground run
      arc(C2, R2, -Math.PI * .44, -Math.PI * 1.5, 10);     // idler: up around the rear
      pts.push([0, 1.12], [2.00, 1.14]);                    // top run (hidden behind the skirts)
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .55], thick = .09, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? .98 : -1.60, yb = sy > 0 ? 1.60 : -.98, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                       // link ridges along the outer surface
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .14)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        M.box(-2.25, 2.20, sy > 0 ? .98 : -1.60, sy > 0 ? 1.60 : -.98, .02, .24, trk);   // lower track run seen between the wheels
        // 8 road-wheel stations, 0.567 m pitch, Ø0.76: alternating outer / inner row (interleaved Schachtellaufwerk)
        const RW = .38, WZ = .49;
        for (let k = 0; k < 8; k++) {
          const x = 2.03 - .567 * k, yc = sy * (k % 2 === 1 ? 1.40 : 1.20);
          L('y', [x, yc, WZ], [[-.07 * f, 0], [-.07 * f, RW, wheel], [.04 * f, RW, tyre], [.04 * f, RW - .08, tyre], [.06 * f, RW - .09, wheel], [.035 * f, .22, wheel], [.035 * f, .10, wheel], [.075 * f, .10, wheel], [.075 * f, 0, wheel]], 22, wheel);
        }
        // drive sprocket (front) and idler (rear)
        L('y', [C1[0], sy * 1.30, C1[1]], [[-.08 * f, 0], [-.08 * f, .35, wheel], [.05 * f, .35, wheel], [.05 * f, .30, dark], [.07 * f, .30, wheel], [.07 * f, .13, wheel], [.10 * f, .13, wheel], [.10 * f, 0, wheel]], 22, wheel);
        L('y', [C2[0], sy * 1.30, C2[1]], [[-.08 * f, 0], [-.08 * f, .30, wheel], [.04 * f, .30, wheel], [.04 * f, .24, dark], [.06 * f, .24, wheel], [.06 * f, .09, wheel], [.09 * f, .09, wheel], [.09 * f, 0, wheel]], 20, wheel);
      }

      return M;
    }

    // ---------- Panzer IV Ausf. G model (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v68: measured from the 1:35 Pz.IV Ausf.G plan drawing (side / top / front; 178.8 px/m from the 6.63 m overall length).
    //      Large silhouette + structure only: full-width hull, low fenders, boxy turret with a D-shaped rear, KwK 40 L/43, 8 small road wheels + 4 return rollers.
    function loftZ(M, A, B, z0, zf, m) {          // convex-ish polygon loft: A at z0, B at per-vertex height zf(x, y)
      const n = A.length, c = [0, 0, 0];
      A.forEach(p => { c[0] += p[0] / n; c[1] += p[1] / n; }); c[2] = z0 + .2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        M.quad([A[i][0], A[i][1], z0], [A[j][0], A[j][1], z0], [B[j][0], B[j][1], zf(B[j][0], B[j][1])], [B[i][0], B[i][1], zf(B[i][0], B[i][1])], m, c);
      }
      let cx = 0, cy = 0; B.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
      const cz = B.reduce((s, p) => s + zf(p[0], p[1]), 0) / n;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, a = [cx, cy, cz], b = [B[i][0], B[i][1], zf(B[i][0], B[i][1])], d = [B[j][0], B[j][1], zf(B[j][0], B[j][1])];
        let nn = nrm(cross(sub(b, a), sub(d, a))); if (nn[2] < 0) nn = neg(nn);
        M.tri(a, b, d, nn, nn, nn, m);
      }
    }
    // sloped-plate attachments: a block lying on the plate P0→P1 (XZ points) at param t, centred at Y, wy wide (Y), hd long along the plate, dep deep along the outward normal
    function plateBlock(M, P0, P1, t, y, wy, hd, dep, m) {
      const dx = P1[0] - P0[0], dz = P1[1] - P0[1], l = Math.hypot(dx, dz), d = [dx / l, dz / l], n = [dz / l, -dx / l];
      const c = [P0[0] + dx * t, P0[1] + dz * t], a = [c[0] - d[0] * hd / 2, c[1] - d[1] * hd / 2], b = [c[0] + d[0] * hd / 2, c[1] + d[1] * hd / 2], ya = y - wy / 2, yb = y + wy / 2;
      M.hex8([[a[0], ya, a[1]], [b[0], ya, b[1]], [b[0], yb, b[1]], [a[0], yb, a[1]],
              [a[0] + n[0] * dep, ya, a[1] + n[1] * dep], [b[0] + n[0] * dep, ya, b[1] + n[1] * dep], [b[0] + n[0] * dep, yb, b[1] + n[1] * dep], [a[0] + n[0] * dep, yb, a[1] + n[1] * dep]], m);
    }
    // bow MG34 in a ball mount (horizontal axis, barrel pointing forward) set into the plate P0→P1 at param t
    function mgBall(M, P0, P1, t, y, mBall, mGun) {
      const c = [P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t];
      M.lathe('x', [c[0] + .02, y, c[1]], [[-.08, 0], [-.08, .07, mBall], [-.03, .10, mBall], [.04, .10, mBall], [.08, .07, mBall], [.09, .03, mGun], [.34, .022, mGun], [.34, 0, mGun]], 18, mBall);
    }
    function buildPanzer4(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.00, FW = 1.48;                                   // hull / fender half-width

      // ---- hull (full-width, 1.94 m) ----
      extrudeXZ(M, [[3.00, 1.02], [2.78, .45], [-2.28, .43], [-2.28, 1.28], [2.10, 1.30]], -HW, HW, hull);                     // lower hull + nose
      extrudeXZ(M, [[2.05, 1.30], [1.45, 1.74], [-1.00, 1.74], [-1.20, 1.67], [-2.28, 1.61], [-2.28, 1.28]], -HW, HW, hull);   // superstructure + engine deck
      extrudeXZ(M, [[-2.28, 1.61], [-2.72, 1.12], [-2.66, .55], [-2.28, .50]], -.92, .92, hull);                                // sloped tail plate
      L('y', [-2.38, .08, 1.30], [[-.60, 0], [-.60, .15], [.60, .15], [.60, 0]], 16, dark);                                     // muffler across the tail
      // fenders (track guards) with the sloped front / rear mud flaps
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? HW : -FW, y1 = sy > 0 ? FW : -HW;
        M.box(-2.35, 2.75, y0, y1, 1.26, 1.30, hull);
        extrudeXZ(M, [[2.75, 1.30], [3.00, 1.02], [3.00, .98], [2.75, 1.26]], y0, y1, hull);
        extrudeXZ(M, [[-2.35, 1.30], [-2.72, 1.04], [-2.72, 1.00], [-2.35, 1.26]], y0, y1, hull);
        M.box(.72, 1.19, sy > 0 ? 1.06 : -1.42, sy > 0 ? 1.42 : -1.06, 1.30, 1.62, dark);                                      // tool / stowage box
        L('y', [.18, sy * 1.07, 1.51], [[-.06, 0], [-.06, .24, tyre], [.06, .24, tyre], [.06, 0]], 18, tyre);                    // spare road wheels on the hull side
        L('y', [-.29, sy * 1.07, 1.51], [[-.06, 0], [-.06, .24, tyre], [.06, .24, tyre], [.06, 0]], 18, tyre);
      }
      // superstructure front (sloped plate): driver's vision port (left), bow MG34 ball mount (right), side vision ports
      { const Q0 = [2.05, 1.30], Q1 = [1.45, 1.74];
        plateBlock(M, Q0, Q1, .55, .50, .32, .11, .07, hull); plateBlock(M, Q0, Q1, .55, .50, .25, .035, .076, glass);
        plateBlock(M, Q0, Q1, .50, -.50, .26, .26, .03, hull); mgBall(M, Q0, Q1, .50, -.50, dark, gun);
        for (const sy of [-1, 1]) { M.box(1.50, 1.74, sy > 0 ? 1.00 : -1.05, sy > 0 ? 1.05 : -1.00, 1.46, 1.60, hull); M.box(1.54, 1.70, sy > 0 ? 1.05 : -1.06, sy > 0 ? 1.06 : -1.05, 1.52, 1.56, glass); } }
      // hatches / vents on the front deck and engine grilles
      for (const sy of [-1, 1]) L('z', [2.35, sy * .55, 1.28], [[0, 0], [0, .20], [.04, .20], [.04, 0]], 16, dark);
      M.box(-1.85, -1.05, -.85, -.43, 1.63, 1.67, grille); M.box(-2.05, -1.50, .28, .70, 1.61, 1.65, grille);

      // ---- turret (wide bevelled front, D-shaped rear box) ----
      const B = [[.98, 0], [.98, .72], [.62, 1.00], [.30, 1.07], [-.40, 1.07], [-.82, .88], [-1.00, .62], [-1.30, .58], [-1.55, .38], [-1.75, 0]];
      const R = [[.85, 0], [.85, .50], [.55, .74], [.30, .78], [-.40, .78], [-.80, .66], [-1.00, .60], [-1.30, .57], [-1.55, .38], [-1.75, 0]];
      const full = h => h.map(([x, y]) => [x, -y]).concat(h.slice(1, -1).reverse());
      loftZ(M, full(B), full(R), 1.74, (x, y) => Math.min(2.33, 2.22 + (.85 - x) * .104), hull);
      // gun mantlet block + KwK 40 L/43 (one tapered tube) + muzzle brake
      M.box(.90, 1.43, -.30, .30, 1.88, 2.22, hull);
      L('x', [1.43, 0, 2.06], [[0, 0], [0, .105], [.50, .10], [.55, .065], [1.85, .05], [1.89, .105], [2.27, .105], [2.27, 0]], 20, gun);
      // commander cupola (centre line, rear) with vision slits; loader hatch; vent
      L('z', [-.65, 0, 2.36], [[0, 0], [0, .38], [.10, .40], [.22, .40], [.26, .36], [.26, 0]], 22, hull);
      for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4 + .2; M.rectZ(-.65 + .34 * Math.cos(a), .34 * Math.sin(a), a, .05, .10, 2.47, 2.55, glass); }
      L('z', [.10, .45, 2.34], [[0, 0], [0, .20], [.04, .20], [.04, 0]], 16, dark);
      L('z', [.12, -.40, 2.33], [[0, 0], [0, .08], [.04, .08], [.04, 0]], 12, dark);

      // ---- tracks & running gear ----
      const C1 = [2.455, .76], R1 = .43, C2 = [-2.30, .56], R2 = .37, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .30, 12);        // sprocket: over the top and the front
      pts.push([2.10, .03], [-1.95, .03]);                  // inclined run to the ground, flat ground run
      arc(C2, R2, -Math.PI * .42, -Math.PI * 1.5, 10);     // idler around the rear
      pts.push([-1.0, 1.06], [1.0, 1.14]);                  // top run (sags slightly toward the idler)
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.05 : -1.45, yb = sy > 0 ? 1.45 : -1.05, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {                       // link ridges
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .12)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        M.box(-2.05, 2.10, sy > 0 ? 1.00 : -1.06, sy > 0 ? 1.06 : -1.00, .38, 1.12, dark);   // suspension side plate (seen between the wheels)
        // 8 road wheels (Ø0.47): rubber tyre + steel disc + raised hub cap, 0.507 m pitch, outboard of the suspension plate
        for (let k = 0; k < 8; k++) {
          const x = 1.94 - .507 * k, RW = .235, yw = sy * 1.28;
          L('y', [x, yw, .29], [[-.07 * f, 0], [-.07 * f, RW, tyre], [.07 * f, RW, tyre], [.07 * f, RW - .06, tyre], [.05 * f, RW - .06, wheel], [.05 * f, .09, wheel], [.10 * f, .09, wheel], [.10 * f, 0, wheel]], 22, wheel);
        }
        // 4 return rollers under the top run
        for (const x of [1.55, .59, -.43, -1.45]) L('y', [x, sy * 1.28, .95], [[-.06 * f, 0], [-.06 * f, .13, tyre], [.06 * f, .13, tyre], [.06 * f, .06, wheel], [.09 * f, .06, wheel], [.09 * f, 0, wheel]], 16, wheel);
        // drive sprocket (front, 8 spokes) and idler (rear, 6 spokes): open spoked wheels
        for (const [C, Rr, ns] of [[C1, .38, 8], [C2, .32, 6]]) {
          L('y', [C[0], sy * 1.26, C[1]], [[-.07 * f, Rr - .05], [-.07 * f, Rr], [.07 * f, Rr], [.07 * f, Rr - .05]], 24, wheel);            // rim
          L('y', [C[0], sy * 1.26, C[1]], [[-.08 * f, 0], [-.08 * f, .10, wheel], [.10 * f, .10, wheel], [.10 * f, 0, dark]], 16, wheel);    // hub
          for (let q = 0; q < ns; q++) { const a = q * Math.PI * 2 / ns + .2, ca = Math.cos(a), sa = Math.sin(a), w = .022, r0 = .08, r1 = Rr - .03;
            extrudeXZ(M, [[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1 - sa * w, C[1] + sa * r1 + ca * w], [C[0] + ca * r1 + sa * w, C[1] + sa * r1 - ca * w], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]], sy * 1.26 - .03, sy * 1.26 + .03, wheel); }
        }
      }
      return M;
    }

    // ---------- Sturmpanzer IV "Brummbär" model, NO side skirts (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v70: measured from the multi-view plan drawing (side/top/front, ~114 px/m on the side + top views, ~120 px/m on the front/rear views).
    //      Pz.IV chassis (8 road wheels, 4 return rollers, front sprocket) carrying a big sloped casemate with a short 15 cm StuH 43 in a round mantlet (offset to the right),
    //      flat roof, rear deck with 4 spare road wheels in a rack, bare track guards (no Schürzen).
    // sloped round plate (a disc lying on the 45° front plate): centre c, radius R, thickness th, normal n = (1,0,1)/√2
    function slopeDisc(M, c, R, th, m) {
      const s = Math.SQRT1_2, nn = [s, 0, s], u2 = [-s, 0, s], n = 28, back = [], front = [];
      for (let k = 0; k < n; k++) {
        const a = k * Math.PI * 2 / n, py = Math.cos(a) * R, pu = Math.sin(a) * R;
        const p = [c[0] + u2[0] * pu, c[1] + py, c[2] + u2[2] * pu]; back.push(p); front.push([p[0] + nn[0] * th, p[1], p[2] + nn[2] * th]);
      }
      const ctr = [c[0] + nn[0] * th * .5, c[1], c[2] + nn[2] * th * .5], fc = [c[0] + nn[0] * th, c[1], c[2] + nn[2] * th];
      for (let k = 0; k < n; k++) {
        const j = (k + 1) % n;
        M.quad(back[k], back[j], front[j], front[k], m, ctr);
        M.tri(fc, front[k], front[j], nn, nn, nn, m);
      }
    }
    function buildBrummbar(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 }), glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.00, FW = 1.52, DZ = 1.30;                         // hull half-width, fender half-width, deck height
      const CY = -.20, CZ = 1.86;                                    // gun axis (right of centre), height

      // ---- chassis hull (Pz.IV): lower hull + nose, flat rear deck, sloped tail ----
      extrudeXZ(M, [[3.00, 1.02], [2.78, .45], [-2.28, .43], [-2.28, 1.28], [2.10, DZ]], -HW, HW, hull);
      extrudeXZ(M, [[-2.28, 1.28], [-2.72, 1.12], [-2.66, .55], [-2.28, .50]], -.92, .92, hull);
      for (const sy of [-1, 1]) {                                     // bare track guards with sloped mud flaps (no skirts)
        const y0 = sy > 0 ? HW : -FW, y1 = sy > 0 ? FW : -HW;
        M.box(-2.35, 2.75, y0, y1, 1.26, DZ, hull);
        extrudeXZ(M, [[2.75, DZ], [3.00, 1.02], [3.00, .98], [2.75, 1.26]], y0, y1, hull);
        extrudeXZ(M, [[-2.35, DZ], [-2.98, 1.02], [-2.98, .98], [-2.35, 1.26]], y0, y1, hull);
        M.box(-2.05, -1.45, sy > 0 ? 1.08 : -1.44, sy > 0 ? 1.44 : -1.08, DZ, 1.52, dark);        // stowage box on each rear track guard
        M.box(1.72, 2.02, sy > 0 ? 1.10 : -1.42, sy > 0 ? 1.42 : -1.10, DZ, 1.38, dark);          // front fender stowage
      }
      // driver / radio-operator hatches and vision blocks on the front deck
      for (const sy of [-1, 1]) {
        M.box(2.14, 2.64, sy * .55 - (sy > 0 ? 0 : .37), sy * .55 + (sy > 0 ? .37 : 0), DZ, 1.36, hull);
        M.box(2.58, 2.70, sy * .64 - .09, sy * .64 + .09, 1.30, 1.42, dark);
      }
      // rear deck: engine louvres + hatches
      // raised rear engine compartment behind the casemate (X -0.94 … -2.32, top Z 1.88) with louvres + hatches on top
      extrudeXZ(M, [[-.92, DZ], [-.92, 1.88], [-2.20, 1.88], [-2.32, 1.80], [-2.32, DZ]], -.95, .95, hull);
      M.box(-2.05, -1.35, -.87, -.47, 1.88, 1.92, grille); M.box(-2.20, -1.50, .33, .75, 1.88, 1.92, grille);
      M.box(-1.40, -1.10, -.20, .20, 1.88, 1.93, dark);

      // ---- casemate: 45° front plate, sloped (trapezoidal) sides, flat roof, rear wall ----
      const A = [[1.97, -.97], [1.55, -1.48], [-.90, -1.48], [-.90, 1.48], [1.55, 1.48], [1.97, .97]];
      const B = [[.87, -.97], [.62, -1.17], [-.72, -1.17], [-.72, 1.17], [.62, 1.17], [.87, .97]];
      loftZ(M, A, B, DZ, (x, y) => Math.min(2.55, 2.40 + (.87 - x) * .10), hull);
      // round mantlet cover (Ø0.9) lying on the front plate + the gun mount and the short 15 cm StuH 43
      slopeDisc(M, [1.41, CY, CZ], .46, .11, hull);
      L('x', [1.45, CY, CZ], [[0, 0], [0, .16], [.52, .16], [.52, .10], [.86, .10], [.86, .125], [.89, .125], [.89, 0]], 22, gun);
      // front plate: driver's vision-port housing (left), bow MG34 in a ball mount (right)
      { const Q0 = [1.97, DZ], Q1 = [.87, 2.40];
        plateBlock(M, Q0, Q1, .22, .55, .30, .24, .10, hull); plateBlock(M, Q0, Q1, .22, .55, .22, .04, .105, glass);
        plateBlock(M, Q0, Q1, .20, -.80, .26, .26, .03, hull); mgBall(M, Q0, Q1, .20, -.80, dark, gun); }
      // roof: loader hatch (Ø0.30), commander hatch (Ø0.55, hinged), vents, antenna base, periscope blocks
      L('z', [.40, -.23, 2.44], [[0, 0], [0, .15], [.04, .15], [.04, 0]], 18, dark);
      L('z', [-.38, .62, 2.55], [[0, 0], [0, .27], [.03, .27], [.03, 0]], 24, dark);
      M.box(-.50, -.18, .40, .84, 2.55, 2.58, hull);
      M.box(.30, .55, .38, .70, 2.46, 2.52, dark);
      M.box(-.72, -.58, -1.06, -.94, 2.50, 2.60, dark);               // antenna mount (right rear roof corner)
      for (const sy of [-1, 1]) M.box(.52, .66, sy * .80 - .08, sy * .80 + .08, 2.40, 2.50, glass);   // front periscopes

      // ---- 4 spare road wheels (axis along X) in a rear rack ----
      M.box(-2.64, -2.30, -1.40, 1.40, 1.46, 1.52, dark);
      for (const yy of [-1.13, -.54, .57, 1.13]) {
        L('x', [-2.575, yy, 1.74], [[-.11, 0], [-.11, .235, tyre], [.11, .235, tyre], [.11, .17, tyre], [.13, .17, wheel], [.13, 0, wheel]], 20, wheel);
        M.box(-2.62, -2.48, yy - .05, yy + .05, DZ, 1.50, dark);
      }

      // ---- tracks & running gear (identical to the Pz.IV) ----
      const C1 = [2.455, .76], R1 = .43, C2 = [-2.30, .56], R2 = .37, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .30, 12);
      pts.push([2.10, .03], [-1.95, .03]);
      arc(C2, R2, -Math.PI * .42, -Math.PI * 1.5, 10);
      pts.push([-1.0, 1.06], [1.0, 1.14]);
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.05 : -1.45, yb = sy > 0 ? 1.45 : -1.05, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .12)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        M.box(-2.05, 2.10, sy > 0 ? 1.00 : -1.06, sy > 0 ? 1.06 : -1.00, .38, 1.12, dark);
        for (let k = 0; k < 8; k++) {
          const x = 1.94 - .507 * k, RW = .235, yw = sy * 1.28;
          L('y', [x, yw, .29], [[-.07 * f, 0], [-.07 * f, RW, tyre], [.07 * f, RW, tyre], [.07 * f, RW - .06, tyre], [.05 * f, RW - .06, wheel], [.05 * f, .09, wheel], [.10 * f, .09, wheel], [.10 * f, 0, wheel]], 22, wheel);
        }
        for (const x of [1.55, .59, -.43, -1.45]) L('y', [x, sy * 1.28, .95], [[-.06 * f, 0], [-.06 * f, .13, tyre], [.06 * f, .13, tyre], [.06 * f, .06, wheel], [.09 * f, .06, wheel], [.09 * f, 0, wheel]], 16, wheel);
        for (const [C, Rr, ns] of [[C1, .38, 8], [C2, .32, 6]]) {
          L('y', [C[0], sy * 1.26, C[1]], [[-.07 * f, Rr - .05], [-.07 * f, Rr], [.07 * f, Rr], [.07 * f, Rr - .05]], 24, wheel);
          L('y', [C[0], sy * 1.26, C[1]], [[-.08 * f, 0], [-.08 * f, .10, wheel], [.10 * f, .10, wheel], [.10 * f, 0, dark]], 16, wheel);
          for (let q = 0; q < ns; q++) { const a = q * Math.PI * 2 / ns + .2, ca = Math.cos(a), sa = Math.sin(a), w = .022, r0 = .08, r1 = Rr - .03;
            extrudeXZ(M, [[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1 - sa * w, C[1] + sa * r1 + ca * w], [C[0] + ca * r1 + sa * w, C[1] + sa * r1 - ca * w], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]], sy * 1.26 - .03, sy * 1.26 + .03, wheel); }
        }
      }
      return M;
    }

    // ---------- Flakpanzer IV "Wirbelwind" model (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v72: measured from the 3-view plan drawing (side/front/rear/top, 217 px/m at 4x).
    //      Pz.IV chassis (8 road wheels, 4 return rollers, front sprocket) with the flat-topped superstructure, an open-topped faceted
    //      octagonal turret (bulged mid-height, thin plate walls) and the quad 2 cm Flakvierling 38 with its barrels elevated ~11°.
    // open wall band between two polygons (no caps). A at z0, B at z1, same vertex count. inward=true flips the normals (inner face)
    function wallBand(M, A, z0, B, z1, m, inward) {
      const n = A.length; let cx = 0, cy = 0; A.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, mx = (A[i][0] + A[j][0]) / 2, my = (A[i][1] + A[j][1]) / 2;
        const c = inward ? [cx + (mx - cx) * 4, cy + (my - cy) * 4, (z0 + z1) / 2] : [cx, cy, (z0 + z1) / 2];
        M.quad([A[i][0], A[i][1], z0], [A[j][0], A[j][1], z0], [B[j][0], B[j][1], z1], [B[i][0], B[i][1], z1], m, c);
      }
    }
    // wall band with vertical gun slots cut through it: slots = { edgeIndex: [s0, s1] } (fraction along the plan edge); the slot spans t in [ta, tb] of this band
    function wallBandS(M, A, z0, B, z1, m, inward, slots, ta, tb) {
      const n = A.length; let cx = 0, cy = 0; A.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
      const P = mkWallP(A, B, z0, z1);
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, mx = (A[i][0] + A[j][0]) / 2, my = (A[i][1] + A[j][1]) / 2, c = inward ? [cx + (mx - cx) * 4, cy + (my - cy) * 4, (z0 + z1) / 2] : [cx, cy, (z0 + z1) / 2];
        const patch = (s0, s1, t0, t1) => M.quad(P(i, s0, t0), P(i, s1, t0), P(i, s1, t1), P(i, s0, t1), m, c), sl = slots[i];
        if (!sl) { patch(0, 1, 0, 1); continue; }
        patch(0, sl[0], 0, 1); patch(sl[1], 1, 0, 1);
        if (ta > 0) patch(sl[0], sl[1], 0, ta);
        if (tb < 1) patch(sl[0], sl[1], tb, 1);
      }
    }
    function mkWallP(A, B, z0, z1) {
      const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      return (i, s, t) => { const j = (i + 1) % A.length, a = lp(A[i], A[j], s), b = lp(B[i], B[j], s), q = lp(a, b, t); return [q[0], q[1], z0 + (z1 - z0) * t]; };
    }
    // reveal faces of the slots (the plate thickness seen through the cut), normals pointing into the opening
    function slotTunnel(M, A, B, Ai, Bi, z0, z1, slots, ta, tb, m) {
      const Po = mkWallP(A, B, z0, z1), Pi = mkWallP(Ai, Bi, z0, z1);
      for (const k of Object.keys(slots)) {
        const i = +k, [s0, s1] = slots[k], sm = (s0 + s1) / 2, tm = (ta + tb) / 2, o = Po(i, sm, tm), q = Pi(i, sm, tm), cen = [(o[0] + q[0]) / 2, (o[1] + q[1]) / 2, (o[2] + q[2]) / 2];
        const face = (a, b, c, d) => { const mid = [0, 1, 2].map(x => (a[x] + b[x] + c[x] + d[x]) / 4); M.quad(a, b, c, d, m, [0, 1, 2].map(x => 2 * mid[x] - cen[x])); };
        face(Po(i, s0, ta), Po(i, s0, tb), Pi(i, s0, tb), Pi(i, s0, ta));
        face(Po(i, s1, ta), Po(i, s1, tb), Pi(i, s1, tb), Pi(i, s1, ta));
        if (ta > 0) face(Po(i, s0, ta), Po(i, s1, ta), Pi(i, s1, ta), Pi(i, s0, ta));
        if (tb < 1) face(Po(i, s0, tb), Po(i, s1, tb), Pi(i, s1, tb), Pi(i, s0, tb));
      }
    }
    // flat ring between an outer and an inner polygon at height z (normal +Z)
    function rimBand(M, Po, Pi, z, m, slots) {
      const n = Po.length; let cx = 0, cy = 0; Po.forEach(p => { cx += p[0] / n; cy += p[1] / n; });
      const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n, seg = (s0, s1) => { const a = lp(Po[i], Po[j], s0), b = lp(Po[i], Po[j], s1), c = lp(Pi[i], Pi[j], s1), d = lp(Pi[i], Pi[j], s0); M.quad([a[0], a[1], z], [b[0], b[1], z], [c[0], c[1], z], [d[0], d[1], z], m, [cx, cy, z - 1]); }, sl = slots && slots[i];
        if (sl) { seg(0, sl[0]); seg(sl[1], 1); } else seg(0, 1);
      }
    }
    // square tube from a to b (tilted), half-width w
    function tube(M, a, b, w, m) {
      const dx = b[0] - a[0], dz = b[2] - a[2], l = Math.hypot(dx, dz), nx = -dz / l, nz = dx / l, e = (p, su, sn) => [p[0] + nx * sn * w, p[1] + su * w, p[2] + nz * sn * w];
      M.hex8([e(a, -1, -1), e(b, -1, -1), e(b, 1, -1), e(a, 1, -1), e(a, -1, 1), e(b, -1, 1), e(b, 1, 1), e(a, 1, 1)], m);
    }
    function buildWirbelwind(paint) {
      const P = PAINT[paint] || PAINT.grey, M = new Mesh();
      const hull = M.mat(P.hull, { spec: .08 }), dark = M.mat(P.dark, { spec: .05 }), gun = M.mat(P.gun, { spec: .22, noise: .5 });
      const trk = M.mat([58, 54, 48], { spec: .06, noise: 1.4 }), trkR = M.mat([70, 64, 56], { shadow: false, noise: 1.4 }), tyre = M.mat([30, 31, 33], { noise: .6 }), wheel = M.mat(P.wheel, { spec: .12 });
      const grille = M.mat([34, 36, 38], { shadow: false, noise: .5 });
      const L = (ax, o, prof, seg, m) => M.lathe(ax, o, prof, seg, m);
      const HW = 1.00, FW = 1.48, DZ = 1.30, TZ = 1.70;             // hull / fender half-width, deck, superstructure top

      // ---- chassis hull (Pz.IV) with the flat-topped superstructure ----
      extrudeXZ(M, [[3.00, 1.02], [2.78, .45], [-2.28, .43], [-2.28, 1.28], [2.10, DZ]], -HW, HW, hull);
      extrudeXZ(M, [[2.05, DZ], [1.82, TZ], [-1.95, TZ], [-2.28, 1.60], [-2.28, 1.28]], -HW, HW, hull);
      extrudeXZ(M, [[-2.28, 1.60], [-2.72, 1.12], [-2.66, .55], [-2.28, .50]], -.92, .92, hull);
      L('y', [-2.38, .08, 1.30], [[-.60, 0], [-.60, .15], [.60, .15], [.60, 0]], 16, dark);          // muffler across the tail
      for (const sy of [-1, 1]) {
        const y0 = sy > 0 ? HW : -FW, y1 = sy > 0 ? FW : -HW;
        M.box(-2.35, 2.75, y0, y1, 1.26, DZ, hull);
        extrudeXZ(M, [[2.75, DZ], [3.00, 1.02], [3.00, .98], [2.75, 1.26]], y0, y1, hull);
        extrudeXZ(M, [[-2.35, DZ], [-2.98, 1.02], [-2.98, .98], [-2.35, 1.26]], y0, y1, hull);
        M.box(.85, 1.40, sy > 0 ? 1.06 : -1.42, sy > 0 ? 1.42 : -1.06, DZ, 1.64, dark);              // front side stowage box
        M.box(-2.07, -.50, sy > 0 ? 1.06 : -1.42, sy > 0 ? 1.42 : -1.06, DZ, 1.56, dark);            // rear side stowage racks (jerrycans, tools)
        M.box(-2.07, -.50, sy > 0 ? 1.04 : -1.44, sy > 0 ? 1.44 : -1.04, 1.56, 1.60, hull);
        L('y', [.37, sy * 1.03, 1.52], [[-.06, 0], [-.06, .22, tyre], [.06, .22, tyre], [.06, 0]], 18, tyre);   // two spare road wheels on each side of the superstructure
        L('y', [-.12, sy * 1.03, 1.52], [[-.06, 0], [-.06, .22, tyre], [.06, .22, tyre], [.06, 0]], 18, tyre);
      }
      for (const sy of [-1, 1]) L('z', [2.35, sy * .55, 1.28], [[0, 0], [0, .20], [.04, .20], [.04, 0]], 16, dark);   // driver / radio hatches
      M.box(2.12, 2.50, -.30, .30, DZ, 1.40, hull);                                                  // front vision block
      M.box(-1.90, -1.20, -.85, -.35, TZ, 1.74, grille); M.box(-1.90, -1.20, .35, .85, TZ, 1.74, grille);   // engine louvres

      // superstructure front: driver's vision port (left), bow MG34 ball mount (right), side vision ports
      { const Q0 = [2.05, DZ], Q1 = [1.82, TZ], glass = M.mat([20, 26, 30], { spec: .8, shadow: false, noise: 0 });
        plateBlock(M, Q0, Q1, .50, .50, .32, .11, .07, hull); plateBlock(M, Q0, Q1, .50, .50, .25, .035, .076, glass);
        plateBlock(M, Q0, Q1, .50, -.50, .26, .26, .03, hull); mgBall(M, Q0, Q1, .50, -.50, dark, gun);
        for (const sy of [-1, 1]) { M.box(1.45, 1.70, sy > 0 ? 1.00 : -1.05, sy > 0 ? 1.05 : -1.00, 1.44, 1.58, hull); M.box(1.50, 1.66, sy > 0 ? 1.05 : -1.06, sy > 0 ? 1.06 : -1.05, 1.50, 1.54, glass); } }
      M.grp = 1;   // v192: turret part (rotates on its own)
      // ---- open-topped faceted turret: 3 levels (bottom Z 1.76, widest Z 2.23, top Z 2.75) ----
      const ring0 = [[.26, -1.14], [-.22, -1.14], [-1.50, -.36], [-1.50, .36], [-.22, 1.14], [.26, 1.14], [1.00, .60], [1.20, 0], [1.00, -.60]];   // plan at the widest level
      const tc = [-.15, 0], ZB = 1.76, ZM = 2.23, ZT = 2.75;
      const lvl = (fx, fr, fy) => ring0.map(([x, y]) => { const f = x > tc[0] ? fx : fr; return [tc[0] + (x - tc[0]) * f, tc[1] + (y - tc[1]) * fy]; });
      const inset = (R, t) => R.map(([x, y]) => { const dx = tc[0] - x, dy = tc[1] - y, l = Math.hypot(dx, dy); return [x + dx / l * t, y + dy / l * t]; });
      const Rb = lvl(.88, .86, .88), Rm = ring0, Rt = lvl(.72, .93, .81), T = .045;
      // "11"-shaped double gun slot in the two front facets (plan edges G→H and H→I): vertical cuts at Y = ±0.35, Z 1.95 … top rim, open at the top; the barrels pass through them
      const slots = { 6: [1 / 3, .5], 7: [.5, 2 / 3] }, taL = (1.95 - ZB) / (ZM - ZB), tbU = 1;   // slots run open to the top rim
      wallBandS(M, Rb, ZB, Rm, ZM, hull, false, slots, taL, 1); wallBandS(M, Rm, ZM, Rt, ZT, hull, false, slots, 0, tbU);   // outer plates
      const Ib = inset(Rb, T), Im = inset(Rm, T), It = inset(Rt, T);
      wallBandS(M, Ib, ZB, Im, ZM, hull, true, slots, taL, 1); wallBandS(M, Im, ZM, It, ZT, hull, true, slots, 0, tbU);     // inner plates
      slotTunnel(M, Rb, Rm, Ib, Im, ZB, ZM, slots, taL, 1, dark); slotTunnel(M, Rm, Rt, Im, It, ZM, ZT, slots, 0, tbU, dark);
      rimBand(M, Rt, It, ZT, hull, slots);                                                                      // top rim
      // turret ring / floor disc inside
      L('z', [-.10, 0, TZ], [[0, 0], [0, .95], [.08, .95], [.08, 0]], 28, dark);                       // turret ring seated on the deck
      // ammunition racks, crew seat, gun mount
      for (const sy of [-1, 1]) M.box(-.62, .28, sy * .66 - .08, sy * .66 + .08, 1.80, 2.12, dark);
      L('z', [-1.08, 0, 1.78], [[0, 0], [0, .22], [.05, .22], [.05, 0]], 16, dark);
      L('z', [-.10, 0, 1.78], [[0, 0], [0, .38], [.30, .30], [.30, 0]], 22, gun);                       // pedestal
      M.box(-.70, .55, -.52, .52, 2.05, 2.16, gun);                                                    // gun platform
      for (const sy of [-1, 1]) {
        M.box(-.75, .45, sy * .35 - .13, sy * .35 + .13, 2.10, 2.58, gun);                              // twin cradles
        for (const [zm, zb] of [[2.66, 2.30], [2.39, 2.03]]) {                                           // upper / lower barrel: muzzle height, breech height at X -.10
          tube(M, [-.10, sy * .35, zb + .22], [1.70, sy * .35, zm], .028, gun);
          tube(M, [1.58, sy * .35, zm - .02], [1.80, sy * .35, zm + .03], .042, dark);                    // flash hider
        }
      }
      M.box(-.50, -.18, -.18, .18, 2.12, 2.72, dark);                                                    // sight column
      tube(M, [-.20, .10, 2.70], [.70, .10, 2.92], .015, dark);                                           // sight arm

      M.grp = 0;
      // ---- tracks & running gear (identical to the Pz.IV) ----
      const C1 = [2.455, .76], R1 = .43, C2 = [-2.30, .56], R2 = .37, pts = [];
      const arc = (c, r, a0, a1, n) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); } };
      arc(C1, R1, Math.PI / 2, -Math.PI * .30, 12);
      pts.push([2.10, .03], [-1.95, .03]);
      arc(C2, R2, -Math.PI * .42, -Math.PI * 1.5, 10);
      pts.push([-1.0, 1.06], [1.0, 1.14]);
      const n = pts.length, cen = [(C1[0] + C2[0]) / 2, .6], thick = .06, outer = pts, inner = pts.map((p, i) => {
        const a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n]; let tx = b[0] - a[0], tz = b[1] - a[1]; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        let nx = -tz, nz = tx; if (nx * (cen[0] - p[0]) + nz * (cen[1] - p[1]) < 0) { nx = -nx; nz = -nz; } return [p[0] + nx * thick, p[1] + nz * thick];
      });
      for (const sy of [-1, 1]) {
        const ya = sy > 0 ? 1.05 : -1.45, yb = sy > 0 ? 1.45 : -1.05, f = sy > 0 ? 1 : -1;
        M.belt(outer, inner, ya, yb, trk);
        for (let i = 0; i < n; i++) {
          const a = outer[i], b = outer[(i + 1) % n], seg = Math.hypot(b[0] - a[0], b[1] - a[1]); if (seg < 1e-6) continue;
          let nx = (b[1] - a[1]) / seg, nz = -(b[0] - a[0]) / seg; if (nx * ((a[0] + b[0]) / 2 - cen[0]) + nz * ((a[1] + b[1]) / 2 - cen[1]) < 0) { nx = -nx; nz = -nz; }
          const cnt = Math.max(1, Math.round(seg / .12)), h = .03;
          for (let q = 0; q < cnt; q++) {
            const t0 = (q + .15) / cnt, t1 = (q + .62) / cnt, p0 = [a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], p1 = [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1];
            M.hex8([[p0[0], ya, p0[1]], [p1[0], ya, p1[1]], [p1[0], yb, p1[1]], [p0[0], yb, p0[1]], [p0[0] + nx * h, ya, p0[1] + nz * h], [p1[0] + nx * h, ya, p1[1] + nz * h], [p1[0] + nx * h, yb, p1[1] + nz * h], [p0[0] + nx * h, yb, p0[1] + nz * h]], trkR);
          }
        }
        M.box(-2.05, 2.10, sy > 0 ? 1.00 : -1.06, sy > 0 ? 1.06 : -1.00, .38, 1.12, dark);
        for (let k = 0; k < 8; k++) {
          const x = 1.94 - .507 * k, RW = .235, yw = sy * 1.28;
          L('y', [x, yw, .29], [[-.07 * f, 0], [-.07 * f, RW, tyre], [.07 * f, RW, tyre], [.07 * f, RW - .06, tyre], [.05 * f, RW - .06, wheel], [.05 * f, .09, wheel], [.10 * f, .09, wheel], [.10 * f, 0, wheel]], 22, wheel);
        }
        for (const x of [1.55, .59, -.43, -1.45]) L('y', [x, sy * 1.28, .95], [[-.06 * f, 0], [-.06 * f, .13, tyre], [.06 * f, .13, tyre], [.06 * f, .06, wheel], [.09 * f, .06, wheel], [.09 * f, 0, wheel]], 16, wheel);
        for (const [C, Rr, ns] of [[C1, .38, 8], [C2, .32, 6]]) {
          L('y', [C[0], sy * 1.26, C[1]], [[-.07 * f, Rr - .05], [-.07 * f, Rr], [.07 * f, Rr], [.07 * f, Rr - .05]], 24, wheel);
          L('y', [C[0], sy * 1.26, C[1]], [[-.08 * f, 0], [-.08 * f, .10, wheel], [.10 * f, .10, wheel], [.10 * f, 0, dark]], 16, wheel);
          for (let q = 0; q < ns; q++) { const a = q * Math.PI * 2 / ns + .2, ca = Math.cos(a), sa = Math.sin(a), w = .022, r0 = .08, r1 = Rr - .03;
            extrudeXZ(M, [[C[0] + ca * r0 - sa * w, C[1] + sa * r0 + ca * w], [C[0] + ca * r1 - sa * w, C[1] + sa * r1 + ca * w], [C[0] + ca * r1 + sa * w, C[1] + sa * r1 - ca * w], [C[0] + ca * r0 + sa * w, C[1] + sa * r0 - ca * w]], sy * 1.26 - .03, sy * 1.26 + .03, wheel); }
        }
      }
      return M;
    }

    // ---------- M4 Sherman (75 mm, welded hull, direct-vision) with the white Allied stars (metres; X forward, Y left, Z up; origin = hull centre on the ground) ----------
    // v81: measured from the M4 (welded hull) 3-view plan drawing (side view ~80 px/m, front view ~81.5 px/m, plan view ~80 px/m; ground line / track length / 2.62 m width as anchors).
    //      Angular welded hull: sloped glacis (~32 deg), vertical side plates, gently sloping rear deck, bolted 3-piece cast final-drive cover, hatch hoods with periscopes, bow MG ball mount,
    //      cast turret with the M34 rotor-shield mantlet and the long M3 75 mm gun, commander's cupola with the .50 cal M2, VVSS bogies (6 road wheels in 3 bogies, 3 return rollers).
    // five-pointed star lying on a surface: surf(x, z) → [x, y, z] on the surface; (cx, cz) centre, R outer radius, ny = outward normal sign along Y
    function starPatch(M, surf, cx, cz, R, ny, m) {
      const o = []; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, r = k % 2 ? R * .382 : R; o.push([cx + r * Math.sin(a), cz + r * Math.cos(a)]); }
      const N = [0, ny, 0], NR = 3, NT = 3;                          // subdivided so that the decal hugs a curved surface instead of cutting chords through it
      for (let k = 0; k < 10; k++) { const A = o[k], B = o[(k + 1) % 10];
        for (let i = 0; i < NR; i++) for (let j = 0; j < NT; j++) {
          const pt = (s, t) => { const ex = A[0] + (B[0] - A[0]) * t, ez = A[1] + (B[1] - A[1]) * t; return surf(cx + (ex - cx) * s, cz + (ez - cz) * s); };
          const s0 = i / NR, s1 = (i + 1) / NR, t0 = j / NT, t1 = (j + 1) / NT, p00 = pt(s0, t0), p10 = pt(s1, t0), p11 = pt(s1, t1), p01 = pt(s0, t1);
          M.tri(p00, p10, p11, N, N, N, m); M.tri(p00, p11, p01, N, N, N, m);
        } }
    }
    // smooth-shaded closed-ring loft: R[i][k] = 3D points (station i, ring index k); per-vertex normals from the neighbouring grid points, oriented away from the ring centroid
    function smoothGrid(M, R, m, capA, capB) {
      const S = R.length, n = R[0].length, cen = R.map(r => { const c = [0, 0, 0]; r.forEach(p => { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; }); return c; });
      const nor = R.map((r, i) => r.map((p, k) => {
        const a = r[(k + 1) % n], b = r[(k - 1 + n) % n], c = R[Math.min(S - 1, i + 1)][k], d = R[Math.max(0, i - 1)][k];
        let v = nrm(cross(sub(a, b), sub(c, d))); if (dot(v, sub(p, cen[i])) < 0) v = neg(v); return v;
      }));
      for (let i = 0; i < S - 1; i++) for (let k = 0; k < n; k++) {
        const j = (k + 1) % n;
        M.tri(R[i][k], R[i][j], R[i + 1][j], nor[i][k], nor[i][j], nor[i + 1][j], m); M.tri(R[i][k], R[i + 1][j], R[i + 1][k], nor[i][k], nor[i + 1][j], nor[i + 1][k], m);
      }
      for (const [cap, i, nd] of [[capA, 0, null], [capB, S - 1, null]]) if (cap) for (let k = 0; k < n; k++) { const j = (k + 1) % n; M.tri(cen[i], R[i][k], R[i][j], cap, cap, cap, m); }
    }
    // squircle ring (|y/W|^4 + |z'/b|^4 = 1: flat deck and sides with rounded shoulders) at station x
    function sqRing(x, W, zT, zB, N, e) {
      const zc = (zT + zB) / 2, b = (zT - zB) / 2, o = []; e = e || .5;
      for (let k = 0; k < N; k++) { const a = k * Math.PI * 2 / N, c = Math.cos(a), s = Math.sin(a); o.push([x, W * Math.sign(c) * Math.pow(Math.abs(c), e), zc + b * Math.sign(s) * Math.pow(Math.abs(s), e)]); }
      return o;
    }

    // flat star lying in an inclined plane: centre = P0 + (P1-P0)*t (XZ), lateral y0, R outer radius; v runs up the slope, u across (Y)
    function starPlane(M, P0, P1, t, y0, R, m) {
      const dx = P1[0] - P0[0], dz = P1[1] - P0[1], l = Math.hypot(dx, dz), d = [dx / l, dz / l], n = [dz / l, -dx / l];
      const c = [P0[0] + dx * t + n[0] * .012, P0[1] + dz * t + n[1] * .012], pts = [];
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, r = k % 2 ? R * .382 : R, u = r * Math.sin(a), v = r * Math.cos(a); pts.push([c[0] + d[0] * v, y0 + u, c[1] + d[1] * v]); }
      const cc = [c[0], y0, c[1]], nn = [n[0], 0, n[1]];
      for (let k = 0; k < 10; k++) M.tri(cc, pts[k], pts[(k + 1) % 10], nn, nn, nn, m);
    }
