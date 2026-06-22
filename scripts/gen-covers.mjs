// Generate on-brand Insights cover images (1600×900 WebP) from hand-built SVGs.
// Clean/light, teal accent, geometric — consistent with the site's SVG diagrams.
// Rasterized with sharp (libvips), the image lib Astro already depends on.
//
//   node scripts/gen-covers.mjs
//
// Output: public/covers/<slug>.webp
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const OUT = "public/covers";

// Shared palette (matches src/styles + public/diagrams/*.svg)
const C = {
  bg: "#f6f7f9",
  soft: "#eaeef3",
  line: "#cbd5e1",
  ink: "#334155",
  inkSoft: "#94a3b8",
  teal: "#0d9488",
  teal2: "#14b8a6",
  tealTint: "#99f6e4",
  tealPale: "#d6faf3",
  white: "#ffffff",
};

// A faint signature dot-matrix, reused on every cover for cohesion.
const dots = (x, y, cols, rows) => {
  let s = "";
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      s += `<circle cx="${x + c * 28}" cy="${y + r * 28}" r="2.4" fill="${C.line}" opacity="0.55"/>`;
  return s;
};

const frame = (inner) => `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="${C.bg}"/>
  <circle cx="1320" cy="180" r="520" fill="${C.soft}" opacity="0.7"/>
  <circle cx="220" cy="820" r="360" fill="${C.soft}" opacity="0.6"/>
  ${inner}
</svg>`;

// ── 1. Benchmarks — bar chart + target line + GPU chip glyph ──────────────
const benchmarks = () => {
  const baseY = 640,
    x0 = 470,
    bw = 84,
    gap = 34;
  const heights = [150, 250, 200, 330, 280, 360, 230];
  const tealIdx = new Set([3, 5]);
  let bars = "";
  heights.forEach((h, i) => {
    const x = x0 + i * (bw + gap);
    const fill = tealIdx.has(i) ? C.teal : C.white;
    const stroke = tealIdx.has(i) ? C.teal : C.line;
    bars += `<rect x="${x}" y="${baseY - h}" width="${bw}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
  });
  const axisR = x0 + heights.length * (bw + gap) - gap;
  return frame(`
    <line x1="${x0 - 30}" y1="${baseY}" x2="${axisR + 20}" y2="${baseY}" stroke="${C.ink}" stroke-width="3"/>
    <line x1="${x0 - 30}" y1="300" x2="${axisR + 20}" y2="300" stroke="${C.teal}" stroke-width="2.5" stroke-dasharray="10 9" opacity="0.85"/>
    ${bars}
    <!-- GPU chip glyph -->
    <g transform="translate(1140 250)">
      <rect x="0" y="0" width="150" height="150" rx="16" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/>
      <rect x="38" y="38" width="74" height="74" rx="8" fill="${C.tealPale}" stroke="${C.teal}" stroke-width="3"/>
      <circle cx="75" cy="75" r="13" fill="${C.teal}"/>
      ${[30, 60, 90, 120].map((p) => `<line x1="${p}" y1="-18" x2="${p}" y2="0" stroke="${C.inkSoft}" stroke-width="3"/><line x1="${p}" y1="150" x2="${p}" y2="168" stroke="${C.inkSoft}" stroke-width="3"/><line x1="-18" y1="${p}" x2="0" y2="${p}" stroke="${C.inkSoft}" stroke-width="3"/><line x1="150" y1="${p}" x2="168" y2="${p}" stroke="${C.inkSoft}" stroke-width="3"/>`).join("")}
    </g>
    ${dots(150, 150, 5, 4)}`);
};

// ── 2. AI orchestration — one branch splitting into parallel tracks ───────
const orchestration = () => {
  const tracks = [250, 390, 530, 670];
  const cy = 460;
  let lines = "",
    nodes = "";
  tracks.forEach((ty, i) => {
    // fork out from left node, run parallel, converge to right node
    lines += `<path d="M360,${cy} C440,${cy} 470,${ty} 560,${ty} L1040,${ty} C1130,${ty} 1160,${cy} 1240,${cy}" fill="none" stroke="${C.line}" stroke-width="3"/>`;
    // 3 node dots along each track, one teal
    [640, 800, 960].forEach((nx, j) => {
      const teal = j === 1 && (i === 0 || i === 2);
      nodes += `<circle cx="${nx}" cy="${ty}" r="13" fill="${teal ? C.teal : C.white}" stroke="${teal ? C.teal : C.ink}" stroke-width="3"/>`;
    });
  });
  return frame(`
    ${lines}
    ${nodes}
    <circle cx="360" cy="${cy}" r="26" fill="${C.teal}"/>
    <circle cx="360" cy="${cy}" r="26" fill="none" stroke="${C.teal2}" stroke-width="3" opacity="0.4" transform="translate(0 0)"/>
    <circle cx="1240" cy="${cy}" r="26" fill="${C.white}" stroke="${C.ink}" stroke-width="3.5"/>
    <circle cx="1240" cy="${cy}" r="9" fill="${C.teal}"/>
    ${dots(1340, 120, 5, 4)}`);
};

// ── 3. Retrieval — horizontal pipeline of nodes with arrows ───────────────
const retrieval = () => {
  const y = 430,
    h = 96,
    w = 150;
  const xs = [430, 660, 890, 1120];
  const tealIdx = new Set([2, 3]);
  let nodes = "",
    arrows = "";
  xs.forEach((x, i) => {
    const teal = tealIdx.has(i);
    nodes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${teal ? C.tealPale : C.white}" stroke="${teal ? C.teal : C.line}" stroke-width="3"/>`;
    // inner glyph: a couple of lines
    nodes += `<line x1="${x + 30}" y1="${y + 38}" x2="${x + w - 30}" y2="${y + 38}" stroke="${teal ? C.teal : C.inkSoft}" stroke-width="4" opacity="0.7"/><line x1="${x + 30}" y1="${y + 60}" x2="${x + w - 50}" y2="${y + 60}" stroke="${teal ? C.teal : C.inkSoft}" stroke-width="4" opacity="0.45"/>`;
    if (i < xs.length - 1) {
      const sx = x + w,
        ex = xs[i + 1];
      arrows += `<line x1="${sx + 8}" y1="${y + h / 2}" x2="${ex - 16}" y2="${y + h / 2}" stroke="${C.ink}" stroke-width="3" marker-end="url(#ar)"/>`;
    }
  });
  // document glyph feeding the first node
  const dx = 250,
    dy = 400;
  const doc = `<path d="M${dx},${dy} h84 l30,30 v110 h-114 Z" fill="${C.white}" stroke="${C.ink}" stroke-width="3"/><path d="M${dx + 84},${dy} v30 h30" fill="none" stroke="${C.ink}" stroke-width="3"/>${[40, 62, 84, 106].map((o) => `<line x1="${dx + 18}" y1="${dy + o}" x2="${dx + 96}" y2="${dy + o}" stroke="${C.inkSoft}" stroke-width="3" opacity="0.6"/>`).join("")}<line x1="${dx + 114}" y1="${y + h / 2}" x2="${xs[0] - 16}" y2="${y + h / 2}" stroke="${C.ink}" stroke-width="3" marker-end="url(#ar)"/>`;
  return frame(`
    <defs><marker id="ar" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="${C.ink}"/></marker></defs>
    ${doc}
    ${arrows}
    ${nodes}
    ${dots(150, 700, 6, 2)}`);
};

// ── 4. Case studies — shield enclosing a small neural network ─────────────
const caseStudies = () => {
  const shield = `M800,238 L968,302 L968,470 Q968,612 800,684 Q632,612 632,470 L632,302 Z`;
  // network inside: 3 layers
  const layers = [
    { x: 712, ys: [400, 520] },
    { x: 800, ys: [360, 460, 560] },
    { x: 888, ys: [400, 520] },
  ];
  let edges = "",
    nodes = "";
  for (let i = 0; i < layers.length - 1; i++)
    for (const a of layers[i].ys)
      for (const b of layers[i + 1].ys)
        edges += `<line x1="${layers[i].x}" y1="${a}" x2="${layers[i + 1].x}" y2="${b}" stroke="${C.line}" stroke-width="2"/>`;
  layers.forEach((L, li) =>
    L.ys.forEach((yy) => {
      const teal = li === 1;
      nodes += `<circle cx="${L.x}" cy="${yy}" r="13" fill="${teal ? C.teal : C.white}" stroke="${teal ? C.teal : C.ink}" stroke-width="3"/>`;
    }),
  );
  return frame(`
    <circle cx="800" cy="460" r="250" fill="${C.white}" opacity="0.55"/>
    <path d="${shield}" fill="${C.white}" stroke="${C.teal}" stroke-width="4"/>
    <path d="M800,238 L968,302 L968,360 Q884,330 800,330 Q716,330 632,360 L632,302 Z" fill="${C.tealPale}" opacity="0.7"/>
    ${edges}
    ${nodes}
    ${dots(1240, 150, 5, 3)}
    ${dots(170, 640, 4, 3)}`);
};

const covers = {
  "benchmarking-iw-rag-one-gpu": benchmarks(),
  "parallel-agents-git-worktrees": orchestration(),
  "local-rag-how-id-build-it-today": retrieval(),
  "building-core-trusting-llms": caseStudies(),
};

await mkdir(OUT, { recursive: true });
for (const [slug, svg] of Object.entries(covers)) {
  const out = `${OUT}/${slug}.webp`;
  const info = await sharp(Buffer.from(svg))
    .resize(1600, 900)
    .webp({ quality: 82, effort: 5 })
    .toFile(out);
  console.log(`${out}  ${(info.size / 1024).toFixed(1)} KB  ${info.width}×${info.height}`);
}
