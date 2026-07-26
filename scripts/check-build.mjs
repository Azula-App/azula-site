#!/usr/bin/env node
/**
 * Post-build assertions on dist/client.
 *
 * Two invariants live here rather than in a unit test, because both are only
 * true of the *output*:
 *
 *  1. Every page has a Markdown twin, and the llms.txt index lists them all.
 *     That's the promise the site makes to a crawler.
 *  2. No page loads a third-party resource. /privacy says "a page here loads
 *     nothing but itself"; this is what keeps that sentence true.
 *
 * Run after `astro build` — `npm run verify` does both.
 */

import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = fileURLToPath(new URL("../dist/client", import.meta.url));

const failures = [];
const fail = (message) => failures.push(message);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

let files;
try {
  files = await walk(DIST);
} catch {
  console.error(`✗ ${relative(process.cwd(), DIST)} not found — run \`npm run build\` first.`);
  process.exit(1);
}

const rel = (path) => `/${relative(DIST, path).split("\\").join("/")}`;
const htmlFiles = files.filter((path) => path.endsWith(".html"));
const mdFiles = new Set(files.filter((path) => path.endsWith(".md")).map(rel));

// ── 1. the machine-readable surface ──────────────────────────────────────────

for (const required of ["/llms.txt", "/llms-full.txt", "/index.html", "/index.md"]) {
  if (!files.map(rel).includes(required)) fail(`missing ${required}`);
}

// Every page except the 404 must have a Markdown twin at the same path.
for (const html of htmlFiles) {
  const path = rel(html);
  if (path === "/404.html") continue;
  const twin = path.replace(/\.html$/, ".md");
  if (!mdFiles.has(twin)) fail(`${path} has no Markdown twin at ${twin}`);
}

const llms = await readFile(join(DIST, "llms.txt"), "utf-8");
for (const twin of mdFiles) {
  if (!llms.includes(twin)) fail(`/llms.txt does not list ${twin}`);
}
if (!llms.startsWith("# azula\n")) fail("/llms.txt must start with an H1 name (llms.txt convention)");
if (!/\n> /.test(llms)) fail("/llms.txt must carry a blockquote summary (llms.txt convention)");

const llmsFull = await readFile(join(DIST, "llms-full.txt"), "utf-8");
if (llmsFull.length < 5000) fail(`/llms-full.txt looks truncated (${llmsFull.length} bytes)`);

// ── 2. the site loads nothing but itself ─────────────────────────────────────

const OFF_ORIGIN = /(?:href|src)\s*=\s*["']?(?:https?:)?\/\//i;

for (const html of htmlFiles) {
  const source = await readFile(html, "utf-8");
  const path = rel(html);

  for (const tag of source.match(/<(?:link|script|img|iframe|source|video|audio)\b[^>]*>/gi) ?? []) {
    // rel="canonical" and rel="alternate" are metadata, not resource loads.
    if (/rel=["']?(?:canonical|alternate)/i.test(tag)) continue;
    if (OFF_ORIGIN.test(tag)) fail(`${path} loads an off-origin resource: ${tag}`);
  }

  for (const host of ["fonts.googleapis.com", "fonts.gstatic.com", "@font-face"]) {
    if (source.includes(host)) fail(`${path} references ${host}`);
  }

  if (!/content-security-policy/i.test(source)) fail(`${path} has no Content-Security-Policy`);
  if (!/default-src 'self'/.test(source)) fail(`${path} CSP does not restrict default-src to 'self'`);

  if (path !== "/404.html" && !/rel="alternate"[^>]*text\/markdown/.test(source)) {
    fail(`${path} does not advertise its Markdown twin with rel="alternate"`);
  }
}

// Stylesheets ship from this origin too — check the bundled CSS for imports.
for (const css of files.filter((path) => path.endsWith(".css"))) {
  const source = await readFile(css, "utf-8");
  if (/@import\s+url\(\s*["']?https?:/i.test(source) || /url\(\s*["']?https?:/i.test(source)) {
    fail(`${rel(css)} pulls in an off-origin resource`);
  }
}

// ── report ───────────────────────────────────────────────────────────────────

if (failures.length) {
  console.error(`✗ ${failures.length} build check${failures.length === 1 ? "" : "s"} failed:\n`);
  for (const failure of failures) console.error(`  · ${failure}`);
  process.exit(1);
}

console.log(
  `✓ build checks passed — ${htmlFiles.length} pages, ${mdFiles.size} Markdown twins, no off-origin resources.`,
);
