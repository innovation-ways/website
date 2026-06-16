// Generates src/data/europe-map.json — a stylized Europe→Turkey silhouette plus
// the six projected city coordinates used by ExperienceMap.astro.
//
// Run once (output is committed): `node scripts/generate-europe-map.mjs`
// Deps are devDependencies only; the site build does not need them.
//
// Why generated: projecting the city markers with the SAME projection that draws
// the map guarantees the pins land in geographically correct spots. Hand-placing
// markers against a borrowed SVG is the usual source of "the dot is in the sea".

import { readFileSync, writeFileSync } from "node:fs";
import { geoMercator, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";

const W = 1000;
const H = 720;
const PAD = 12;

// Geographic frame: Atlantic (Lisbon) → just past Istanbul; south Iberia/Italy →
// southern UK. Anything outside clips against the viewBox. Expressed as corner
// points (not a polygon) so spherical winding-order can't flip it to the
// complement — fitExtent only needs the bounding extent.
const FRAME = {
  type: "MultiPoint",
  coordinates: [[-11, 34], [31, 34], [31, 56], [-11, 56]],
};

// The six pins (lon, lat). Keys match src/data/experience.ts.
const CITIES = [
  { key: "lisbon", lon: -9.1393, lat: 38.7223 },
  { key: "madrid", lon: -3.7038, lat: 40.4168 },
  { key: "bordeaux", lon: -0.5792, lat: 44.8378 },
  { key: "paris", lon: 2.3522, lat: 48.8566 },
  { key: "zurich", lon: 8.5417, lat: 47.3769 },
  { key: "istanbul", lon: 28.9784, lat: 41.0082 },
];

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const countries = topo.objects.countries;
const fc = feature(topo, countries);

// Render any country that intersects the frame (cheap centroid+bbox test would
// drop edge slivers; we keep all and let the viewBox clip).
const projection = geoMercator()
  .fitExtent([[PAD, PAD], [W - PAD, H - PAD]], FRAME);

const path = geoPath(projection);

// Keep only countries whose projected bounds overlap the viewBox (+margin); the
// rest of the world is offscreen and would just bloat the path strings.
const M = 60;
const inFrame = (f) => {
  const b = path.bounds(f);
  return b[1][0] >= -M && b[0][0] <= W + M && b[1][1] >= -M && b[0][1] <= H + M;
};
const kept = fc.features.filter(inFrame);
const keptNames = new Set(kept.map((f) => f.properties.name));

const land = path({ type: "FeatureCollection", features: kept }); // combined fill path
const borders = path(
  mesh(topo, countries, (a, b) =>
    a !== b && (keptNames.has(a.properties.name) || keptNames.has(b.properties.name))),
); // interior borders touching the visible region only

const cities = CITIES.map((c) => {
  const [x, y] = projection([c.lon, c.lat]);
  return { key: c.key, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
});

const out = {
  _generated: "scripts/generate-europe-map.mjs",
  viewBox: `0 0 ${W} ${H}`,
  width: W,
  height: H,
  land,
  borders,
  cities,
};

writeFileSync("src/data/europe-map.json", JSON.stringify(out, null, 0) + "\n");

// Sanity: cities should read left→right Lisbon, Madrid, Bordeaux, Paris, Zurich, Istanbul.
console.log("viewBox", out.viewBox);
console.log(
  "cities (x asc):",
  [...cities].sort((a, b) => a.x - b.x).map((c) => `${c.key}@${c.x},${c.y}`).join("  "),
);
