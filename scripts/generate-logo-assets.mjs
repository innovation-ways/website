/**
 * Generate the Innovation Ways logo asset set from the canonical B-1 "IW" monogram.
 *
 *   Chrome logo  (Nav/Footer) : mono ink W + teal I, theme-aware — lives in Logo.astro (not here).
 *   Favicons / app icons      : teal roundel + white IW (always visible on any browser chrome).
 *   og-image.png (1200x630)   : mark + wordmark lockup on paper, for social cards.
 *   logo.png (512)            : square teal-tile mark, for JSON-LD Organization.logo.
 *
 * Run:  node scripts/generate-logo-assets.mjs   (writes into ./public)
 * Requires the Space Grotesk TTF visible to fontconfig for the og-image wordmark.
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PUB = new URL('../public/', import.meta.url).pathname;
const TEAL = '#0D9488';
const INK = '#222631';
const PAPER = '#FCFCFC';
const MUTED = '#6B7280';
const TMP = tmpdir();

// Canonical B-1 mark in a 32x32 box. `i` = the teal I stroke, `w` = the W stroke.
const STROKE = 3.2;
function markPaths(iColor, wColor) {
  return `
    <path d="M6 8 V24" fill="none" stroke="${iColor}" stroke-width="${STROKE}" stroke-linecap="round"/>
    <path d="M13.5 8 L16.7 24 L20 14.5 L23.3 24 L26.5 8" fill="none" stroke="${wColor}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

// teal rounded-tile icon, white IW, with `padPct` breathing room (bigger pad => maskable-safe)
function iconSvg(size, padPct) {
  const off = size * padPct;
  const s = (size * (1 - 2 * padPct)) / 32;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${TEAL}"/>
    <g transform="translate(${off},${off}) scale(${s})">${markPaths('#FFFFFF', '#FFFFFF')}</g>
  </svg>`;
}

async function png(svg, file, w, h = w) {
  await sharp(Buffer.from(svg), { density: 384 }).resize(w, h).png().toFile(join(PUB, file));
  console.log('  ✓', file, `${w}x${h}`);
}

console.log('Favicons / app icons (teal tile + white IW):');
await png(iconSvg(32, 0.13), 'favicon-32x32.png', 32);
await png(iconSvg(16, 0.12), 'favicon-16x16.png', 16);
await png(iconSvg(180, 0.16), 'apple-touch-icon.png', 180);
await png(iconSvg(192, 0.16), 'android-chrome-192x192.png', 192);
await png(iconSvg(512, 0.20), 'android-chrome-512x512.png', 512); // generous pad => maskable-safe
await png(iconSvg(512, 0.16), 'logo.png', 512);                   // square mark for JSON-LD

// favicon.ico (16/32/48) via ImageMagick
console.log('favicon.ico:');
for (const sz of [16, 32, 48]) {
  await sharp(Buffer.from(iconSvg(sz, 0.13)), { density: 384 }).resize(sz, sz).png().toFile(join(TMP, `ico${sz}.png`));
}
execSync(`convert ${join(TMP, 'ico16.png')} ${join(TMP, 'ico32.png')} ${join(TMP, 'ico48.png')} ${join(PUB, 'favicon.ico')}`);
console.log('  ✓ favicon.ico');

// favicon.svg — vector teal tile (no theme flip needed; teal reads on light & dark chrome)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${TEAL}"/>
  <g transform="translate(4.5,4.5) scale(0.71875)">${markPaths('#FFFFFF', '#FFFFFF')}</g>
</svg>
`;
writeFileSync(join(PUB, 'favicon.svg'), faviconSvg);
console.log('  ✓ favicon.svg');

// og-image.png — 1200x630 social card: mark + wordmark lockup on paper
console.log('og-image:');
const W = 1200, H = 630;
const markSz = 150;
const wordSize = 78;
const groupY = 250;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${TEAL}"/>
  <g transform="translate(330,${groupY}) scale(${markSz / 32})">${markPaths(TEAL, INK)}</g>
  <text x="${330 + markSz + 28}" y="${groupY + markSz * 0.66}" font-family="Space Grotesk" font-weight="600" font-size="${wordSize}" letter-spacing="-2" fill="${INK}">Innovation<tspan fill="${TEAL}"> Ways</tspan></text>
  <text x="${W / 2}" y="${groupY + markSz + 70}" font-family="Space Grotesk" font-weight="400" font-size="30" letter-spacing="-0.3" fill="${MUTED}" text-anchor="middle">Telecom BSS engineering — production AI, built in the open.</text>
</svg>`;
await png(og, 'og-image.png', W, H);

console.log('\nDone. Regenerated logo asset set in public/.');
