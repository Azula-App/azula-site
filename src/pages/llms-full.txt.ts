import type { APIRoute } from "astro";
import { allMarkdownPages } from "../lib/content";
import { llmsFull } from "../lib/llms";
import { text } from "../lib/http";

/** /llms-full.txt — the whole site as a single Markdown document. */
export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL("https://azula.app")).origin;
  return text(llmsFull(await allMarkdownPages(), origin));
};
