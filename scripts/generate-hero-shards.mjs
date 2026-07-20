// Procedural photorealistic glass shard generator.
// Renders high-res raster shards on a canvas in headless Chromium and
// saves them as transparent PNGs.
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";

const OUT = process.argv[2] ?? "public/hero-shards";
mkdirSync(OUT, { recursive: true });

// Everything inside render() runs in the browser page.
const render = (params) => {
  const { seed, W, H, verts, elong, jag, chips, cracks, microCracks, tone, rimBoost, transparency } = params;

  // --- deterministic rng ---
  let s = seed | 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rr = (a, b) => a + rnd() * (b - a);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const cx = W / 2, cy = H / 2;

  // ---------- 1. silhouette: angular shard — long straight edges, sharp points, micro-jag ----------
  // evenly-spaced jittered angles → compact convex crystal with one sharp point
  const startA = rnd() * Math.PI * 2;
  const spikeAt = (rnd() * verts) | 0;
  const base = [];
  for (let i = 0; i < verts; i++) {
    const a = startA + (i / verts) * Math.PI * 2 + rr(-0.9, 0.9) / verts;
    const r = (i === spikeAt ? rr(1.05, 1.2) : rr(0.6, 0.92)) * Math.min(W, H) * 0.4;
    base.push([cx + Math.cos(a) * r * elong, cy + Math.sin(a) * r]);
  }

  // only fine-scale displacement: keep edges straight, add fracture micro-jag
  let contour = base.map((p) => p.slice());
  for (let level = 0; level < 4; level++) {
    const next = [];
    const amp = level < 2 ? 0 : jag * Math.min(W, H) * 0.005;
    for (let i = 0; i < contour.length; i++) {
      const a = contour[i];
      const b = contour[(i + 1) % contour.length];
      next.push(a);
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1];
      const len = Math.hypot(dx, dy) || 1;
      const d = rr(-amp, amp);
      next.push([mx + (-dy / len) * d, my + (dx / len) * d]);
    }
    contour = next;
  }

  // chips: small sharp notches bitten out of the contour
  for (let c = 0; c < chips; c++) {
    const i = (rnd() * contour.length) | 0;
    const p = contour[i];
    const depth = rr(2, 7) * (W / 1000);
    p[0] += rr(-depth, depth);
    p[1] += rr(-depth, depth);
  }

  const tracePath = (c) => {
    ctx.beginPath();
    ctx.moveTo(contour[0][0], contour[0][1]);
    for (const p of contour) ctx.lineTo(p[0], p[1]);
    ctx.closePath();
  };

  // ---------- 2. dark glass body ----------
  ctx.save();
  tracePath(ctx);
  ctx.clip();

  const bodyG = ctx.createLinearGradient(0, 0, W * 0.85, H);
  bodyG.addColorStop(0, `rgba(${26 + tone}, ${29 + tone}, ${35 + tone}, ${0.96 - transparency})`);
  bodyG.addColorStop(0.45, `rgba(${11 + tone}, ${13 + tone}, ${17 + tone}, ${0.98 - transparency})`);
  bodyG.addColorStop(1, `rgba(${4 + tone}, ${5 + tone}, ${8 + tone}, ${1 - transparency})`);
  ctx.fillStyle = bodyG;
  ctx.fillRect(0, 0, W, H);

  // thin translucent zone near a random edge — glass gets clearer where thin
  const thinG = ctx.createRadialGradient(cx + rr(-0.3, 0.3) * W, cy + rr(-0.3, 0.3) * H, 0, cx, cy, W * 0.65);
  thinG.addColorStop(0, "rgba(235, 240, 246, 0.06)");
  thinG.addColorStop(0.5, "rgba(235, 240, 246, 0.015)");
  thinG.addColorStop(1, "rgba(235, 240, 246, 0)");
  ctx.fillStyle = thinG;
  ctx.fillRect(0, 0, W, H);

  // ---------- 3. one soft sky wedge only ----------
  // The reference's glass face reads almost flat/uniform. An earlier version
  // drew a half-plane facet overlay here too, but its clip boundary produced
  // a visible hard seam line across the face (confirmed visually) — removed
  // rather than only softened. `facetN` is kept in the per-shard config for
  // now (harmless/unused) so future tuning can reintroduce a *properly*
  // soft-edged version without reshaping the config schema.
  // one broad, very soft "sky reflection" wedge — subtle, not a bright band
  {
    const i1 = (rnd() * contour.length) | 0;
    const i2 = (i1 + ((contour.length * rr(0.3, 0.45)) | 0)) % contour.length;
    const p1 = contour[i1], p2 = contour[i2];
    ctx.save();
    ctx.filter = `blur(${W * 0.02}px)`;
    const sg = ctx.createLinearGradient(p1[0], p1[1], p2[0], p2[1]);
    sg.addColorStop(0, "rgba(210, 220, 232, 0)");
    sg.addColorStop(0.48, `rgba(210, 220, 232, ${rr(0.05, 0.09)})`);
    sg.addColorStop(0.55, `rgba(210, 220, 232, ${rr(0.03, 0.06)})`);
    sg.addColorStop(1, "rgba(210, 220, 232, 0)");
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H);
    ctx.filter = "none";
    ctx.restore();
  }

  // ---------- 4. internal smoke / cloudiness (barely perceptible) ----------
  for (let k = 0; k < 2; k++) {
    const gx = rr(0.25, 0.75) * W, gy = rr(0.25, 0.75) * H;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, rr(0.2, 0.4) * W);
    g.addColorStop(0, `rgba(0, 0, 0, ${rr(0.05, 0.1)})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------- 5. cracks: dense spiderweb radiating from 1-2 impact origins ----------
  // Matches the reference's fracture look: many thin branches, sharp micro-kinks,
  // sub-branching, small bright node dots at joints — not a handful of thick
  // scratchy lines.
  const crackNodes = [];
  const drawCrackBranch = (x, y, angle, len, width, depth, maxDepth) => {
    let px = x, py = y, a = angle;
    const segLen = Math.max(W * 0.006, len / (7 + depth * 2));
    let remaining = len;
    while (remaining > segLen * 0.7) {
      a += rnd() < 0.22 ? rr(-0.7, 0.7) : rr(-0.2, 0.2);
      const step = Math.min(segLen, remaining);
      const nx = px + Math.cos(a) * step;
      const ny = py + Math.sin(a) * step;
      ctx.strokeStyle = `rgba(230, 238, 246, ${rr(0.22, 0.42)})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      px = nx;
      py = ny;
      remaining -= step;
      if (depth < maxDepth && rnd() < 0.24) {
        crackNodes.push([px, py, width]);
        drawCrackBranch(
          px,
          py,
          a + rr(0.5, 1.15) * (rnd() > 0.5 ? 1 : -1),
          remaining * rr(0.35, 0.6),
          width * rr(0.6, 0.8),
          depth + 1,
          maxDepth,
        );
      }
    }
    crackNodes.push([px, py, width * 0.8]);
  };

  for (let originIdx = 0; originIdx < cracks; originIdx++) {
    const ox = rr(0.28, 0.72) * W;
    const oy = rr(0.28, 0.72) * H;
    const branchCount = 3 + ((rnd() * 3) | 0);
    crackNodes.push([ox, oy, 1.4 * (W / 1000)]);
    for (let b = 0; b < branchCount; b++) {
      const a = (b / branchCount) * Math.PI * 2 + rr(-0.5, 0.5);
      drawCrackBranch(ox, oy, a, rr(0.18, 0.32) * Math.min(W, H), rr(0.7, 1.1) * (W / 1000), 0, 3);
    }
  }
  // isolated hairline micro-fractures, unconnected to the main web
  for (let c = 0; c < microCracks; c++) {
    drawCrackBranch(
      rr(0.15, 0.85) * W,
      rr(0.15, 0.85) * H,
      rnd() * Math.PI * 2,
      rr(0.05, 0.13) * W,
      rr(0.45, 0.7) * (W / 1000),
      2,
      3,
    );
  }
  // bright node dots at branch/kink points — the small "impact" look
  for (const [nx, ny, w] of crackNodes) {
    if (rnd() < 0.55) continue;
    const radius = w * rr(1.6, 3);
    const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
    g.addColorStop(0, `rgba(255, 255, 255, ${rr(0.3, 0.55)})`);
    g.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(nx, ny, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---------- 7. grain ----------
  const noise = ctx.createImageData(W, H);
  for (let i = 0; i < noise.data.length; i += 4) {
    const v = 180 + ((rnd() * 70) | 0);
    noise.data[i] = v;
    noise.data[i + 1] = v + 3;
    noise.data[i + 2] = v + 8;
    noise.data[i + 3] = rnd() < 0.5 ? 0 : (rnd() * 14) | 0;
  }
  const nCan = document.createElement("canvas");
  nCan.width = W;
  nCan.height = H;
  nCan.getContext("2d").putImageData(noise, 0, 0);
  ctx.globalCompositeOperation = "overlay";
  ctx.drawImage(nCan, 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // ---------- 8. inner shadow along shadow-side contour ----------
  ctx.save();
  tracePath(ctx);
  ctx.clip();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineWidth = W * 0.05;
  ctx.filter = `blur(${W * 0.02}px)`;
  tracePath(ctx);
  ctx.stroke();
  ctx.filter = "none";
  ctx.restore();

  ctx.restore(); // silhouette clip off

  // ---------- 9. rim light with chromatic fringe (outside clip so it sits on the edge) ----------
  const litSegment = (p, q) => {
    let nxr = -(q[1] - p[1]), nyr = q[0] - p[0];
    const nl = Math.hypot(nxr, nyr) || 1;
    nxr /= nl;
    nyr /= nl;
    // orient the normal outward (away from the centroid)
    const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    if ((mx + nxr - cx) ** 2 + (my + nyr - cy) ** 2 < (mx - nxr - cx) ** 2 + (my - nyr - cy) ** 2) {
      nxr = -nxr;
      nyr = -nyr;
    }
    // key light from top-left: outward normals facing up-left get lit
    return Math.max(0, nxr * -0.707 + nyr * -0.707);
  };

  for (let i = 0; i < contour.length; i++) {
    const p = contour[i];
    const q = contour[(i + 1) % contour.length];
    const lit = litSegment(p, q);
    const alpha = 0.02 + Math.pow(lit, 1.6) * 0.95 * rimBoost;
    // normalized inward normal (toward centre)
    let nx2 = -(q[1] - p[1]), ny2 = q[0] - p[0];
    const nl2 = Math.hypot(nx2, ny2) || 1;
    nx2 /= nl2;
    ny2 /= nl2;
    const midx = (p[0] + q[0]) / 2, midy = (p[1] + q[1]) / 2;
    if ((midx + nx2 * 10 - cx) ** 2 + (midy + ny2 * 10 - cy) ** 2 > (midx - nx2 * 10 - cx) ** 2 + (midy - ny2 * 10 - cy) ** 2) {
      nx2 = -nx2;
      ny2 = -ny2;
    }
    // Reference shows no chromatic fringing — crisp neutral-white edges only.
    // A very tight, bright core rim (thin, not a glow) is the whole effect.
    ctx.strokeStyle = `rgba(252, 253, 255, ${Math.min(1, alpha * 1.25)})`;
    ctx.lineWidth = Math.max(0.7, W / 1100) * (0.35 + lit * 1.6);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.lineTo(q[0], q[1]);
    ctx.stroke();
    // glass thickness: a fainter inner bevel line parallel to lit edges
    if (lit > 0.45) {
      const off = rr(3, 7) * (W / 1000) + lit * 4 * (W / 1000);
      ctx.strokeStyle = `rgba(226, 236, 248, ${alpha * 0.4})`;
      ctx.lineWidth = Math.max(0.7, W / 1400);
      ctx.beginPath();
      ctx.moveTo(p[0] + nx2 * off, p[1] + ny2 * off);
      ctx.lineTo(q[0] + nx2 * off, q[1] + ny2 * off);
      ctx.stroke();
    }
    // occasional sparkle at vertices facing the light
    if (lit > 0.85 && rnd() < 0.08) {
      const g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr(6, 16) * (W / 1000));
      g.addColorStop(0, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(p[0] - 20, p[1] - 20, 40, 40);
    }
  }

  return canvas.toDataURL("image/png");
};

const SHARDS = [
  // main: large, dark, densely cracked — carries the memory etching
  { name: "shard-main", seed: 811, W: 1100, H: 1400, verts: 6, elong: 0.82, jag: 0.9, chips: 10, facetN: 1, cracks: 2, microCracks: 16, tone: 0, rimBoost: 1, transparency: 0.06 },
  { name: "shard-b", seed: 422, W: 760, H: 900, verts: 5, elong: 1.1, jag: 1.1, chips: 8, facetN: 1, cracks: 1, microCracks: 10, tone: 4, rimBoost: 0.9, transparency: 0.1 },
  { name: "shard-c", seed: 977, W: 700, H: 980, verts: 5, elong: 0.7, jag: 0.85, chips: 6, facetN: 1, cracks: 1, microCracks: 10, tone: 2, rimBoost: 0.85, transparency: 0.08 },
  { name: "shard-d", seed: 233, W: 560, H: 640, verts: 4, elong: 1.2, jag: 1.2, chips: 6, facetN: 0, cracks: 1, microCracks: 8, tone: 6, rimBoost: 0.8, transparency: 0.12 },
  { name: "shard-e", seed: 655, W: 520, H: 700, verts: 5, elong: 0.75, jag: 1, chips: 5, facetN: 0, cracks: 1, microCracks: 6, tone: 8, rimBoost: 0.75, transparency: 0.14 },
  { name: "shard-f", seed: 149, W: 420, H: 480, verts: 4, elong: 1, jag: 1.3, chips: 5, facetN: 0, cracks: 1, microCracks: 6, tone: 10, rimBoost: 0.7, transparency: 0.16 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("about:blank");

for (const def of SHARDS) {
  const dataUrl = await page.evaluate(render, def);
  const b64 = dataUrl.split(",")[1];
  writeFileSync(`${OUT}/${def.name}.png`, Buffer.from(b64, "base64"));
  console.log(def.name, "->", `${OUT}/${def.name}.png`, `${Math.round((b64.length * 3) / 4 / 1024)}kb`);
}

await browser.close();
console.log("done");
