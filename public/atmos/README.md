# Atmospheric imagery — section breaks

Full-bleed photo bands placed between text-heavy sections (see
`src/components/AtmosphericBreak.astro`). Each band renders **nothing** until its
image exists here, so the page is never broken while assets are pending.

Currently referenced:

| File              | Where                                          |
| ----------------- | ---------------------------------------------- |
| `work.jpg`        | Homepage, before the Work grid (with text)     |
| `work-detail.jpg` | `/work`, between the intro and the grid (image-only) |
| `about.jpg`       | `/about`, lead-in to the experience map (image-only) |
| `lisbon.jpg`      | Footer CTA on **every page** — the photographic close (with text) |

**Format.** JPG or WebP, **landscape**, ~2000 px wide (full-bleed). The shared
treatment desaturates + teal-washes them, so plain colour AI-generated or licensed
images work — see `docs/imagery-brief.md` for ready-to-use generation prompts.

Add more by dropping a file here and passing its `src` to `<AtmosphericBreak>`.
