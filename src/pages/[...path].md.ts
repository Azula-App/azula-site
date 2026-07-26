import type { APIRoute, GetStaticPaths } from "astro";
import { allMarkdownPages } from "../lib/content";
import { markdownDocument, markdownPath } from "../lib/llms";
import { markdown } from "../lib/http";

/**
 * Every page's Markdown twin, from one rule: the HTML page's path plus ".md".
 * "/" → /index.md, "/privacy" → /privacy.md, "/docs" → /docs.md,
 * "/docs/cli" → /docs/cli.md.
 *
 * The body served here is the same Markdown file the HTML page renders, so the
 * two cannot drift.
 */
export const getStaticPaths = (async () => {
  const pages = await allMarkdownPages();
  return pages.map((page) => ({
    // markdownPath() returns "/docs/cli.md"; the route param is "docs/cli".
    params: { path: markdownPath(page.path).replace(/^\//, "").replace(/\.md$/, "") },
    props: { page },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => markdown(markdownDocument(props.page));
