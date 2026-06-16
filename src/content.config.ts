import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Insights / writing. Drop markdown files into src/content/insights/.
// (The RAG article drafts can move straight in here.)
const insights = defineCollection({
  loader: glob({ base: "./src/content/insights", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});

// Work / project write-ups. One markdown file per project; frontmatter drives the
// homepage cards, the body is the long-form narrative on /work/[slug].
const work = defineCollection({
  loader: glob({ base: "./src/content/work", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    tags: z.array(z.string()),
    status: z.enum(["oss", "private"]),
    order: z.number().default(99),
    diagram: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { insights, work };
