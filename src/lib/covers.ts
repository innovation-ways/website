import { existsSync } from "node:fs";

// Extensions we accept for an article cover image, in priority order.
const EXTS = ["webp", "avif", "png", "jpg", "jpeg"] as const;

/**
 * Resolve the cover image for an Insights post.
 *
 * Priority:
 *   1. an explicit `image` path from frontmatter (escape hatch), else
 *   2. convention: the first existing `public/covers/<slug>.<ext>`, else
 *   3. `null` — the caller falls back to the generative <CoverArt /> constellation.
 *
 * This runs at build time (Node), so dropping a correctly-named file into
 * public/covers/ is all it takes to give an article a real picture — no
 * frontmatter edit, no code change.
 */
export function resolveCover(slug: string, explicit?: string): string | null {
  if (explicit) return explicit;
  for (const ext of EXTS) {
    const rel = `/covers/${slug}.${ext}`;
    if (existsSync(`public${rel}`)) return rel;
  }
  return null;
}
