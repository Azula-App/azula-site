import type { APIRoute } from "astro";
import { docMarkdownPages, standaloneMarkdownPages } from "../lib/content";
import { llmsIndex } from "../lib/llms";
import { text } from "../lib/http";

/**
 * /llms.txt — the llmstxt.org index for this site. Generated from the content
 * collections, so a page added to /docs shows up here without anyone
 * remembering to list it.
 */
export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL("https://azula.app")).origin;
  return text(
    llmsIndex({
      docs: await docMarkdownPages(),
      pages: await standaloneMarkdownPages(),
      origin,
    }),
  );
};
