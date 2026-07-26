/**
 * Adapters from the content collections to the plain shape the Markdown/llms.txt
 * builders (and the docs pages) work with. One place decides how a collection
 * entry id maps to a URL, so the HTML page, its `.md` twin, and /llms.txt can
 * never disagree about a path.
 */

import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { MarkdownPage } from "./llms";

/** "index" → /docs, "cli" → /docs/cli */
export function docPath(id: string): string {
  return id === "index" ? "/docs" : `/docs/${id}`;
}

/** "home" → /, "privacy" → /privacy */
export function pagePath(id: string): string {
  return id === "home" ? "/" : `/${id}`;
}

function toMarkdownPage(path: string, entry: { data: { title: string; description: string }; body?: string }): MarkdownPage {
  return {
    path,
    title: entry.data.title,
    description: entry.data.description,
    body: entry.body ?? "",
  };
}

/** Docs entries in sidebar order. */
export async function docEntries(): Promise<CollectionEntry<"docs">[]> {
  const entries = await getCollection("docs");
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function docMarkdownPages(): Promise<MarkdownPage[]> {
  return (await docEntries()).map((entry) => toMarkdownPage(docPath(entry.id), entry));
}

export async function standaloneMarkdownPages(): Promise<MarkdownPage[]> {
  const entries = await getCollection("pages");
  // Home first, then the rest alphabetically — the order /llms-full.txt reads in.
  return entries
    .map((entry) => toMarkdownPage(pagePath(entry.id), entry))
    .sort((a, b) => (a.path === "/" ? -1 : b.path === "/" ? 1 : a.path.localeCompare(b.path)));
}

/** Every page that has a Markdown twin, in reading order: home, docs, then the rest. */
export async function allMarkdownPages(): Promise<MarkdownPage[]> {
  const standalone = await standaloneMarkdownPages();
  const home = standalone.filter((page) => page.path === "/");
  const rest = standalone.filter((page) => page.path !== "/");
  return [...home, ...(await docMarkdownPages()), ...rest];
}

/** A single standalone page (home, privacy) as a Markdown page. */
export async function standaloneMarkdownPage(id: string): Promise<MarkdownPage | undefined> {
  const entry = await getEntry("pages", id);
  return entry ? toMarkdownPage(pagePath(entry.id), entry) : undefined;
}
