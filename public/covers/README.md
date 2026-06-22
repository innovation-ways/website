# Insights cover images

Drop an article's cover image here and it appears automatically — on the
`/insights` cards, the homepage list, and the article banner. No code or
frontmatter change needed.

## How it works

The filename must match the article's **slug** (its markdown filename without
`.md`, i.e. the URL after `/insights/`). Accepted extensions, in priority
order: `.webp`, `.avif`, `.png`, `.jpg`, `.jpeg`.

```
public/covers/<slug>.webp     →  used as the cover for /insights/<slug>
```

If no file is present, the page falls back to the generative constellation
artwork, so nothing ever breaks. To point an article at a different path,
set `image: "/some/path.png"` (and optionally `imageAlt`) in its frontmatter.

## Recommended image spec

- **Aspect ratio:** 16:9 landscape (cropped with `object-cover` for the card,
  the homepage thumbnail, and the wide article banner).
- **Size:** ~1600×900 px. Keep files lean — prefer **WebP**, aim < 250 KB.
- **Style:** clean / light, lots of whitespace, teal accent (`#0D9488`),
  abstract or editorial-technical — not stock photography. Should sit happily
  next to the rest of the site.

## Current articles → expected filenames

| Slug (filename) | Drop a file named |
|---|---|
| `building-core-trusting-llms` | `building-core-trusting-llms.webp` |
| `local-rag-how-id-build-it-today` | `local-rag-how-id-build-it-today.webp` |
| `benchmarking-iw-rag-one-gpu` | `benchmarking-iw-rag-one-gpu.webp` |
| `parallel-agents-git-worktrees` | `parallel-agents-git-worktrees.webp` |
