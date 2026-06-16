// Innovation Ways — brand asset generator.
// One source of truth for the IW monogram + wordmark, rendered to every SVG/PNG the
// company needs (favicons, app icons, social avatars, OG card, LinkedIn banners…).
//
// Vector marks are pure paths (fully portable, no font dependency). Wordmark lockups
// use live <text> in Space Grotesk 600 — rasterised via sharp's bundled librsvg/pango,
// which picks up the locally-installed Space Grotesk (~/.fonts/SpaceGrotesk.ttf).
//
//   node scripts/build-brand-assets.mjs
//
// Re-run any time the mark, colours, or taglines change. Outputs to design/iw-assets/.

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "design", "iw-assets");
const DIR = { svg: join(OUT, "svg"), png: join(OUT, "png"), social: join(OUT, "social") };
Object.values(DIR).forEach((d) => mkdirSync(d, { recursive: true }));

// ── Brand tokens ──────────────────────────────────────────────────────────
const TEAL = "#0D9488"; // accent
const TEAL_STRONG = "#115E59"; // accent-strong
const INK = "#1A1D23"; // near-black text
const PAPER = "#FFFFFF"; // light background
const SURFACE_DARK = "#1B1F27"; // dark-mode paper
const MUTED = "#71757E"; // secondary text
const WHITE = "#FFFFFF";

const FONT = "Space Grotesk";
const WORDMARK = "Innovation Ways";
const WM_W = 7.57; // measured advance width of "Innovation Ways" per 1px font-size (weight 600, ls -0.02em)
const WM_LS = -0.02; // letter-spacing in em

// ── The mark (32×32 grid) ───────────────────────────────────────────────────
const I_PATH = "M6 8 V24";
const W_PATH = "M13.5 8 L16.7 24 L20 14.5 L23.3 24 L26.5 8";
const SW = 3.2;
// Visible ink bbox of the stroked mark within the 32 grid (path ± half stroke + cap):
const IB = { x0: 4.4, x1: 28.1, y0: 6.4, y1: 25.6 };
const INK_W = IB.x1 - IB.x0; // 23.7
const INK_H = IB.y1 - IB.y0; // 19.2

/** Mark paths placed via a transform, with chosen I/W colours. */
function mark(transform, iColor, wColor) {
  return `  <path d="${I_PATH}" transform="${transform}" stroke="${iColor}" stroke-width="${SW}" stroke-linecap="round" fill="none"/>
  <path d="${W_PATH}" transform="${transform}" stroke="${wColor}" stroke-width="${SW}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
}

/** A mark scaled so its visible ink is `inkH` tall, with its ink top-left at (x,y). */
function markInk(x, y, inkH, iColor, wColor) {
  const s = inkH / INK_H;
  const tx = x - IB.x0 * s;
  const ty = y - IB.y0 * s;
  return { svg: mark(`translate(${tx} ${ty}) scale(${s})`, iColor, wColor), w: INK_W * s, h: inkH, s };
}

function wordmark(x, baseline, fontSize, fill) {
  return `  <text x="${x}" y="${baseline}" font-family="${FONT}" font-weight="600" font-size="${fontSize}" letter-spacing="${WM_LS * fontSize}" fill="${fill}">${WORDMARK}</text>`;
}
const wmWidth = (fontSize) => WM_W * fontSize;

function doc(w, h, body, bg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
${bg ? `  <rect width="${w}" height="${h}" fill="${bg}"/>\n` : ""}${body}
</svg>`;
}

// ── Standalone marks (32×32, transparent) ────────────────────────────────────
const markDoc = (iColor, wColor) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" aria-label="Innovation Ways">
${mark("", iColor, wColor)}
</svg>`;

const SVGS = {};
SVGS["iw-mark.svg"] = markDoc(TEAL, INK); // primary: teal I + ink W (light bg)
SVGS["iw-mark-white.svg"] = markDoc(TEAL, WHITE); // teal I + white W (dark / photo bg)
SVGS["iw-mark-mono-ink.svg"] = markDoc(INK, INK); // single-colour ink
SVGS["iw-mark-mono-white.svg"] = markDoc(WHITE, WHITE); // single-colour white

// ── App-icon tile (rounded teal square + white monogram) ─────────────────────
function tile(size, { maskable = false } = {}) {
  const rx = Math.round(size * 0.219); // matches favicon.svg ratio (7/32)
  // maskable → mark sits in the inner ~80% safe zone; standard → ~72% (favicon parity)
  const inkH = size * (maskable ? 0.4 : 0.46);
  const m = markInk(0, 0, inkH, WHITE, WHITE);
  const tx = (size - m.w) / 2 - m.s * IB.x0;
  const ty = (size - m.h) / 2 - m.s * IB.y0;
  const g = mark(`translate(${tx} ${ty}) scale(${m.s})`, WHITE, WHITE);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" role="img" aria-label="Innovation Ways">
  <rect width="${size}" height="${size}" rx="${maskable ? 0 : rx}" fill="${TEAL}"/>
${g}
</svg>`;
}
SVGS["iw-tile.svg"] = tile(512);
SVGS["iw-tile-maskable.svg"] = tile(512, { maskable: true });

// ── Horizontal lockup (mark + wordmark) ──────────────────────────────────────
function horizontal(wmFill, iColor, wColor) {
  const H = 120;
  const markInkH = 84;
  const m = markInk(0, 0, markInkH, iColor, wColor);
  const markX = 14;
  const markTop = (H - markInkH) / 2;
  const mk = markInk(markX, markTop, markInkH, iColor, wColor);
  const gap = 30;
  const fontSize = 66;
  const wmX = markX + mk.w + gap;
  const baseline = H / 2 + fontSize * 0.345; // optical centre for caps+lc
  const totalW = Math.ceil(wmX + wmWidth(fontSize) + 14);
  const body = `${mk.svg}\n${wordmark(wmX, baseline, fontSize, wmFill)}`;
  return doc(totalW, H, body, null);
}
SVGS["iw-logo-horizontal.svg"] = horizontal(INK, TEAL, INK);
SVGS["iw-logo-horizontal-white.svg"] = horizontal(WHITE, TEAL, WHITE);

// ── Stacked lockup (mark above wordmark) ─────────────────────────────────────
function stacked(wmFill, iColor, wColor) {
  const markInkH = 120;
  const fontSize = 52;
  const wmW = wmWidth(fontSize);
  const m = markInk(0, 0, markInkH, iColor, wColor);
  const W = Math.ceil(Math.max(m.w, wmW) + 28);
  const markX = (W - m.w) / 2;
  const mk = markInk(markX, 14, markInkH, iColor, wColor);
  const gap = 30;
  const baseline = 14 + markInkH + gap + fontSize * 0.72;
  const H = Math.ceil(baseline + fontSize * 0.16 + 12);
  const wmX = (W - wmW) / 2;
  const body = `${mk.svg}\n${wordmark(wmX, baseline, fontSize, wmFill)}`;
  return doc(W, H, body, null);
}
SVGS["iw-logo-stacked.svg"] = stacked(INK, TEAL, INK);

// ── Wordmark only ─────────────────────────────────────────────────────────
function wordmarkOnly(fill) {
  const fontSize = 80;
  const W = Math.ceil(wmWidth(fontSize) + 16);
  const H = Math.ceil(fontSize * 1.12);
  const baseline = fontSize * 0.82;
  return doc(W, H, wordmark(8, baseline, fontSize, fill), null);
}
SVGS["iw-wordmark.svg"] = wordmarkOnly(INK);

// ── Decorative constellation (echoes the site CoverArt) ──────────────────────
// Fixed nodes in a 0..100 box; placed/scaled per composition.
const NODES = [
  [82, 18], [92, 30], [70, 34], [88, 52], [76, 64],
  [95, 70], [64, 50], [84, 80], [73, 88], [58, 28],
];
const EDGES = [[0, 1], [0, 2], [1, 3], [2, 6], [3, 4], [3, 5], [4, 7], [4, 8], [6, 9], [5, 7]];
function constellation(x, y, w, h, { accent = TEAL, lineOpacity = 0.16, dotOpacity = 0.34 } = {}) {
  const px = (i) => x + (NODES[i][0] / 100) * w;
  const py = (i) => y + (NODES[i][1] / 100) * h;
  const lines = EDGES.map(([a, b]) => `<line x1="${px(a).toFixed(1)}" y1="${py(a).toFixed(1)}" x2="${px(b).toFixed(1)}" y2="${py(b).toFixed(1)}" stroke="${accent}" stroke-opacity="${lineOpacity}" stroke-width="1.5"/>`).join("\n  ");
  const dots = NODES.map((_, i) => `<circle cx="${px(i).toFixed(1)}" cy="${py(i).toFixed(1)}" r="${i === 3 ? 7 : 4.5}" fill="${accent}" fill-opacity="${i === 3 ? 0.85 : dotOpacity}"/>`).join("\n  ");
  return `  ${lines}\n  ${dots}`;
}

// ── Composed banners / cards ─────────────────────────────────────────────────
function banner(w, h, { dark = false, headline, sub, urls, padX } = {}) {
  const bg = dark ? SURFACE_DARK : PAPER;
  const wmFill = dark ? WHITE : INK;
  const wColor = dark ? WHITE : INK;
  const subFill = dark ? "#A9ADB6" : MUTED;
  const px = padX ?? Math.round(w * 0.07);
  // logo lockup
  const markInkH = Math.round(h * 0.2);
  const cy = Math.round(h * 0.33);
  const mk = markInk(px, cy - markInkH / 2, markInkH, TEAL, wColor);
  const fontSize = Math.round(markInkH * 0.82);
  const wmX = px + mk.w + Math.round(markInkH * 0.34);
  const wmBaseline = cy + fontSize * 0.345;
  // headline + sub
  const hlSize = Math.round(h * 0.085);
  const hlY = Math.round(h * 0.62);
  const subSize = Math.round(h * 0.055);
  const subY = hlY + Math.round(hlSize * 1.45);
  const urlY = h - Math.round(h * 0.12);
  const urlSize = Math.round(h * 0.05);
  const body = [
    constellation(w * 0.66, 0, w * 0.34, h, { lineOpacity: dark ? 0.22 : 0.14, dotOpacity: dark ? 0.4 : 0.3 }),
    mk.svg,
    wordmark(wmX, wmBaseline, fontSize, wmFill),
    headline ? `  <text x="${px}" y="${hlY}" font-family="${FONT}" font-weight="600" font-size="${hlSize}" letter-spacing="${-0.02 * hlSize}" fill="${wmFill}">${headline}</text>` : "",
    sub ? `  <text x="${px}" y="${subY}" font-family="Inter, ${FONT}" font-weight="400" font-size="${subSize}" fill="${subFill}">${sub}</text>` : "",
    urls ? `  <text x="${px}" y="${urlY}" font-family="Inter, ${FONT}" font-weight="500" font-size="${urlSize}" fill="${TEAL}">${urls}</text>` : "",
  ].filter(Boolean).join("\n");
  return doc(w, h, body, bg);
}

// Avatar-safe variant: LinkedIn pastes the profile photo over the lower-left, so the
// logo stays top-left, the headline/sub/url block moves RIGHT (right-aligned, clear of the
// photo), and the constellation fills the vacated centre-left space.
function bannerAvatarSafe(w, h, { dark = false, headline, sub, urls } = {}) {
  const bg = dark ? SURFACE_DARK : PAPER;
  const wmFill = dark ? WHITE : INK;
  const wColor = dark ? WHITE : INK;
  const subFill = dark ? "#A9ADB6" : MUTED;
  const px = Math.round(w * 0.07);
  // Logo lockup — top-left (unchanged from the default personal banner)
  const markInkH = Math.round(h * 0.2);
  const cy = Math.round(h * 0.33);
  const mk = markInk(px, cy - markInkH / 2, markInkH, TEAL, wColor);
  const fontSize = Math.round(markInkH * 0.82);
  const wmX = px + mk.w + Math.round(markInkH * 0.34);
  const wmBaseline = cy + fontSize * 0.345;
  // Text block — right-aligned, vertically centred on the right side
  const rx = w - px;
  const hlSize = Math.round(h * 0.085);
  const subSize = Math.round(h * 0.055);
  const urlSize = Math.round(h * 0.05);
  const hlY = Math.round(h * 0.46);
  const subY = hlY + Math.round(hlSize * 1.45);
  const urlY = subY + Math.round(subSize * 2.0);
  const body = [
    // constellation fills the centre-left gap (clear of both the photo and the right text)
    constellation(w * 0.31, h * 0.5, w * 0.28, h * 0.46, { lineOpacity: dark ? 0.22 : 0.14, dotOpacity: dark ? 0.4 : 0.3 }),
    mk.svg,
    wordmark(wmX, wmBaseline, fontSize, wmFill),
    `  <text x="${rx}" y="${hlY}" text-anchor="end" font-family="${FONT}" font-weight="600" font-size="${hlSize}" letter-spacing="${-0.02 * hlSize}" fill="${wmFill}">${headline}</text>`,
    `  <text x="${rx}" y="${subY}" text-anchor="end" font-family="Inter, ${FONT}" font-weight="400" font-size="${subSize}" fill="${subFill}">${sub}</text>`,
    `  <text x="${rx}" y="${urlY}" text-anchor="end" font-family="Inter, ${FONT}" font-weight="500" font-size="${urlSize}" fill="${TEAL}">${urls}</text>`,
  ].join("\n");
  return doc(w, h, body, bg);
}

function ogCard() {
  const w = 1200, h = 630;
  const cx = w / 2;
  const markInkH = 118;
  const gap = 30;
  const fontSize = 88;
  const mk = markInk(0, 0, markInkH, TEAL, INK);
  const lockupW = mk.w + gap + wmWidth(fontSize);
  const startX = cx - lockupW / 2;
  const cyMark = 246;
  const mk2 = markInk(startX, cyMark - markInkH / 2, markInkH, TEAL, INK);
  const wmX = startX + mk2.w + gap;
  const wmBaseline = cyMark + fontSize * 0.345;
  const sub = "Telecom BSS engineering · Production-grade applied AI";
  const subSize = 32;
  const url = "innovation-ways.com";
  const body = [
    constellation(0, 0, w, h, { lineOpacity: 0.08, dotOpacity: 0.16 }),
    mk2.svg,
    `  <text x="${wmX}" y="${wmBaseline}" font-family="${FONT}" font-weight="600" font-size="${fontSize}" letter-spacing="${-0.02 * fontSize}" fill="${INK}">${WORDMARK}</text>`,
    `  <text x="${cx}" y="410" text-anchor="middle" font-family="Inter, ${FONT}" font-weight="400" font-size="${subSize}" fill="${MUTED}">${sub}</text>`,
    `  <rect x="${cx - 30}" y="452" width="60" height="3" rx="1.5" fill="${TEAL}"/>`,
    `  <text x="${cx}" y="528" text-anchor="middle" font-family="Inter, ${FONT}" font-weight="600" font-size="32" fill="${TEAL}">${url}</text>`,
  ].join("\n");
  return doc(w, h, body, PAPER);
}

// ── Write SVG sources ─────────────────────────────────────────────────────
for (const [name, svg] of Object.entries(SVGS)) {
  writeFileSync(join(DIR.svg, name), svg + "\n");
}

// Banner/card SVG sources (kept editable next to their PNGs)
const HEADLINE = "Mission-critical systems, built in the open.";
const SUB = "Telecom BSS engineering · Production-grade applied AI";
const URLS = "innovation-ways.com   ·   github.com/innovation-ways";

const liCompany = banner(1128, 191, { headline: null, sub: SUB, urls: URLS, padX: 56 });
const liPersonal = banner(1584, 396, { headline: HEADLINE, sub: SUB, urls: URLS });
const liPersonalDark = banner(1584, 396, { dark: true, headline: HEADLINE, sub: SUB, urls: URLS });
const liPersonalSafe = bannerAvatarSafe(1584, 396, { headline: HEADLINE, sub: SUB, urls: URLS });
const liPersonalSafeDark = bannerAvatarSafe(1584, 396, { dark: true, headline: HEADLINE, sub: SUB, urls: URLS });
const xHeader = banner(1500, 500, { headline: HEADLINE, sub: SUB, urls: URLS });
const og = ogCard();
writeFileSync(join(DIR.social, "linkedin-company-cover-1128x191.svg"), liCompany + "\n");
writeFileSync(join(DIR.social, "linkedin-personal-banner-1584x396.svg"), liPersonal + "\n");
writeFileSync(join(DIR.social, "linkedin-personal-banner-dark-1584x396.svg"), liPersonalDark + "\n");
writeFileSync(join(DIR.social, "linkedin-personal-banner-avatar-safe-1584x396.svg"), liPersonalSafe + "\n");
writeFileSync(join(DIR.social, "linkedin-personal-banner-avatar-safe-dark-1584x396.svg"), liPersonalSafeDark + "\n");
writeFileSync(join(DIR.social, "x-header-1500x500.svg"), xHeader + "\n");
writeFileSync(join(DIR.png, "og-image-1200x630.svg"), og + "\n");

// ── Rasterise PNGs ──────────────────────────────────────────────────────────
const png = (svg, w, h) => {
  let p = sharp(Buffer.from(svg), { density: 384 });
  if (w || h) p = p.resize(w, h, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
  return p.png();
};
const out = (name, dir) => join(DIR[dir], name);

async function rasterAt(svg, name, dir, size) {
  // Render the SVG at an explicit pixel size (square or w×h from caller-set root size).
  await sharp(Buffer.from(svg), { density: 384 }).resize(size).png().toFile(out(name, dir));
}
async function rasterExact(svgStr, name, dir) {
  // SVG already carries exact width/height — render 1:1 at high density then it matches.
  await sharp(Buffer.from(svgStr)).png().toFile(out(name, dir));
}
async function rasterTrim(svgStr, name, dir, pad = 120) {
  // Render at high density for crisp large exports, then crop tight + uniform padding.
  const buf = await sharp(Buffer.from(svgStr), { density: 384 }).png().toBuffer();
  await sharp(buf)
    .trim()
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out(name, dir));
}

const tasks = [];
// Marks (transparent, square)
tasks.push(rasterAt(SVGS["iw-mark.svg"], "iw-mark-512.png", "png", 512));
tasks.push(rasterAt(SVGS["iw-mark.svg"], "iw-mark-1024.png", "png", 1024));
tasks.push(rasterAt(SVGS["iw-mark-white.svg"], "iw-mark-white-1024.png", "png", 1024));
// Tiles / app icons
tasks.push(rasterAt(SVGS["iw-tile.svg"], "iw-tile-512.png", "png", 512));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "iw-tile-1024.png", "png", 1024));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "apple-touch-icon-180.png", "png", 180));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "android-chrome-192.png", "png", 192));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "android-chrome-512.png", "png", 512));
tasks.push(rasterAt(SVGS["iw-tile-maskable.svg"], "maskable-512.png", "png", 512));
// Favicons (the rounded-teal mark, on the teal tile, small sizes)
tasks.push(rasterAt(SVGS["iw-tile.svg"], "favicon-16.png", "png", 16));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "favicon-32.png", "png", 32));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "favicon-48.png", "png", 48));
// Lockups (transparent, tight-cropped)
tasks.push(rasterTrim(SVGS["iw-logo-horizontal.svg"], "iw-logo-horizontal-2400.png", "png", 40));
tasks.push(rasterTrim(SVGS["iw-logo-horizontal-white.svg"], "iw-logo-horizontal-white-2400.png", "png", 40));
tasks.push(rasterTrim(SVGS["iw-logo-stacked.svg"], "iw-logo-stacked-1600.png", "png", 40));
tasks.push(rasterTrim(SVGS["iw-wordmark.svg"], "iw-wordmark-1600.png", "png", 24));
// OG card
tasks.push(rasterExact(og, "og-image-1200x630.png", "png"));
// Social
tasks.push(rasterExact(liCompany, "linkedin-company-cover-1128x191.png", "social"));
tasks.push(rasterExact(liPersonal, "linkedin-personal-banner-1584x396.png", "social"));
tasks.push(rasterExact(liPersonalDark, "linkedin-personal-banner-dark-1584x396.png", "social"));
tasks.push(rasterExact(liPersonalSafe, "linkedin-personal-banner-avatar-safe-1584x396.png", "social"));
tasks.push(rasterExact(liPersonalSafeDark, "linkedin-personal-banner-avatar-safe-dark-1584x396.png", "social"));
tasks.push(rasterExact(xHeader, "x-header-1500x500.png", "social"));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "linkedin-avatar-400.png", "social", 400));
tasks.push(rasterAt(SVGS["iw-tile.svg"], "github-org-avatar-512.png", "social", 512));

await Promise.all(tasks);
console.log(`✓ Generated ${Object.keys(SVGS).length} SVGs + ${tasks.length} PNGs → design/iw-assets/`);
