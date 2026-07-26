import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Markdown is the source of truth for prose on this site, not an export of it.
 * The HTML page and the `.md` twin an LLM fetches are rendered from the same
 * file, so they cannot drift.
 */

const docs = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/docs" }),
  schema: z.object({
    title: z.string(),
    /** One line. Shown as the page lede, the meta description, and the note in /llms.txt. */
    description: z.string(),
    /** Sidebar and /llms.txt ordering. */
    order: z.number(),
  }),
});

/** Standalone pages that live outside /docs but still have Markdown twins. */
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { docs, pages };
