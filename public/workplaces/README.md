# Workplace photos — experience map popups

Drop a photo per engagement here. Until a file exists, the popup shows a tasteful
"Workplace photo — to be added" placeholder, so nothing looks broken.

Expected files (exact names — referenced from `src/data/experience.ts`):

| File                  | Engagement                    |
| --------------------- | ----------------------------- |
| `sunrise.jpg`         | Sunrise — Zürich              |
| `orange.jpg`          | Orange — Bordeaux             |
| `vodafone-tr.jpg`     | Vodafone Turkey — Istanbul    |
| `vodafone-es.jpg`     | Vodafone Spain — Madrid       |
| `bnp-paribas.jpg`     | BNP Paribas — Paris           |
| `vodafone-pt.jpg`     | Vodafone Portugal — Lisbon    |
| `axa.jpg`             | AXA — Lisbon                  |

**Format.** JPG or WebP. Displayed at a **16:9** crop, so landscape images work
best. ~1200 px wide is plenty. (PNG works too — update the path in
`src/data/experience.ts` if you change the extension.)
