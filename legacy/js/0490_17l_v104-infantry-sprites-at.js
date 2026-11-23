  // ══════════════════════════════════════════════════════════════
  // [17l] v104 — infantry sprites at scale: 64 distinct figures now, so the sprite cache is LRU-capped, directions are baked on demand
  //       (no all-direction warm-up), built meshes are capped too; one-man squads (snipers) get a single-figure portrait
  // ══════════════════════════════════════════════════════════════
  { const o_get = INF_SPR.get; INF_SPR.CAP = 480; INF_SPR.MESH_CAP = 28;
    INF_SPR.get = function (fig, fa) {
      const ck = fig + '|' + TANK_SPR.idx(fa), hit = this.sig === TANK_SPR.sig && this.cache.get(ck);
      if (hit) { this.cache.delete(ck); this.cache.set(ck, hit); return hit; }
      const e = o_get.call(this, fig, fa);
      while (this.cache.size > this.CAP) this.cache.delete(this.cache.keys().next().value);
      if (this.meshes.has(fig)) { const m = this.meshes.get(fig); this.meshes.delete(fig); this.meshes.set(fig, m); }
      while (this.meshes.size > this.MESH_CAP) this.meshes.delete(this.meshes.keys().next().value);
      return e;
    };
    INF_SPR.warm = function () {}; }

