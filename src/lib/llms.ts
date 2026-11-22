/**
 * Builders for the machine-readable half of the site: the per-page Markdown
 * twins, /llms.txt, and /llms-full.txt.
 *
 * These are pure functions over already-loaded content entries so they can be
 * unit-tested without a build (see llms.test.ts). The endpoints in
 * src/pages/ are thin wrappers that read the collections and call these.
 */

import { SITE_SUMMARY, SITE_URL, REPOS } from "./site";

export interface MarkdownPage {
  /** Path of the HTML page, without extension — e.g. "/docs/cli" or "/". */
  path: string;
  title: string;
  description: string;
  /** Raw Markdown body, frontmatter already stripped by the content loader. */
  body: string;
}

/** Absolute URL of a page's Markdown twin. "/" becomes "/index.md". */
export function markdownUrl(path: string, origin: string = SITE_URL): string {
  return new URL(markdownPath(path), origin).href;
}

/** Site-relative path of a page's Markdown twin. */
export function markdownPath(path: string): string {
  return path === "/" ? "/index.md" : `${path}.md`;
}

/** HTML comments carry notes for whoever edits the file; they aren't content. */
function stripComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->\n*/g, "");
}

/**
 * One page as a standalone Markdown document: an H1 title, the description as
 * a blockquote summary, then the body exactly as authored.
 */
export function markdownDocument(page: MarkdownPage): string {
  const body = stripComments(page.body).trim();
  return `# ${page.title}\n\n> ${page.description}\n\n${body}\n`;
}

export interface LlmsIndexOptions {
  /** Docs pages, in sidebar order. */
  docs: MarkdownPage[];
  /** Standalone pages (home, privacy). */
  pages: MarkdownPage[];
  origin?: string;
}

/**
 * /llms.txt — the llmstxt.org convention: an H1 name, a blockquote summary,
 * then sections of links with a one-line note each. Every link points at the
 * Markdown twin, so a crawler that follows them never has to parse HTML.
 */
export function llmsIndex({ docs, pages, origin = SITE_URL }: LlmsIndexOptions): string {
  const link = (page: MarkdownPage) =>
    `- [${page.title}](${markdownUrl(page.path, origin)}): ${page.description}`;

  const home = pages.find((page) => page.path === "/");
  const rest = pages.filter((page) => page.path !== "/");

  const sections: string[] = [
    `# azula`,
    ``,
    `> ${SITE_SUMMARY}`,
    ``,
    `azula is two halves: an app for Android, iOS and desktop, and \`azula\`, a`,
    `single-binary CLI that hosts terminals, moves files, runs an MCP server so an`,
    `LLM can talk to your devices, and gives cloud coding agents Linux VMs on the`,
    `user's Mac. Every page on this site is available as Markdown at the same path`,
    `plus \`.md\`.`,
    ``,
    ...computeQuickstart(origin),
    `## Docs`,
    ``,
    ...(home ? [link(home)] : []),
    ...docs.map(link),
    ``,
    `## Reference`,
    ``,
    ...rest.map(link),
    ``,
    `## Source`,
    ``,
    ...REPOS.map((repo) => `- [${repo.name}](${repo.url}): ${repo.blurb}`),
    ``,
    `## Optional`,
    ``,
    `- [Full site as one document](${new URL("/llms-full.txt", origin).href}): every page above, concatenated.`,
    ``,
  ];

  return sections.join("\n");
}

/**
 * The remote-compute recipe, inline in /llms.txt: the agents that use it are
 * the ones reading this file from a cloud sandbox, so they get working
 * commands here rather than only a link. Keep it in step with
 * src/content/docs/compute.md and `azula compute --help`.
 */
export function computeQuickstart(origin: string = SITE_URL): string[] {
  const cli = "npx -y @azula-app/cli";
  return [
    `## Remote compute for cloud agents`,
    ``,
    `If you are an agent in a cloud sandbox (Claude Code, Codex) and the user gave`,
    `you an \`AZULA_COMPUTE_TOKEN\`, you can run commands and move files inside a`,
    `Linux VM (Debian 13, arm64) on their Mac. Nothing you send runs on the Mac`,
    `itself.`,
    ``,
    "```sh",
    `${cli} compute doctor                      # relay, host and grant; names the hop that fails`,
    `${cli} compute exec -- uname -a           # argv runs directly; exit code passes through`,
    `${cli} compute exec -- sh -c 'make -j8'   # ask for a shell explicitly`,
    `${cli} compute push -r ./src work/src     # copy a tree in`,
    `${cli} compute exec --cwd work/src --timeout 30m -- make`,
    `${cli} compute pull work/src/out/app ./app`,
    `${cli} compute exec --detach -- ./long.sh # prints <vm>/j_…`,
    `${cli} compute logs --follow <vm>/j_…     # also: attach, jobs, cancel`,
    "```",
    ``,
    `- Network: allow HTTPS egress to \`use1-1.relay.n0.iroh.link\`, \`usw1-1.relay.n0.iroh.link\`,`,
    `  \`euc1-1.relay.n0.iroh.link\`, \`aps1-1.relay.n0.iroh.link\` and \`dns.iroh.link\`. Set`,
    `  \`AZULA_RELAY_ONLY=1\` when the sandbox has no UDP. \`HTTPS_PROXY\` and the system CA`,
    `  store are honored.`,
    `- VMs: if the grant covers several, pass \`--vm NAME\` or set \`AZULA_COMPUTE_VM\`;`,
    `  \`compute doctor --vm NAME\` also checks the VM's worker. \`exec\` starts a stopped VM`,
    `  when the grant allows it.`,
    `- Jobs keep running if your connection drops; \`exec\` reattaches at the exact byte,`,
    `  and if it can't, prints the \`compute attach\` command to use. Results are kept 24 h.`,
    `- Files: \`push\`/\`pull\` are SHA-256 verified, atomic, and resume when rerun. Paths are`,
    `  in the VM (relative to the job user's home); the Mac's own files are not reachable.`,
    `- azula's own exit codes: 124 timeout, 125 broker or grant error, 126 bad \`--cwd\`,`,
    `  127 command not found, 130 cancelled, 255 connection lost or job interrupted.`,
    `- The user sets it up on an Apple silicon Mac with \`azula vm create\`,`,
    `  \`azula compute serve\` and \`azula compute grant\`. Full guide:`,
    `  ${markdownUrl("/docs/compute", origin)}`,
    ``,
  ];
}

/** /llms-full.txt — every page in one document, in reading order. */
export function llmsFull(pages: MarkdownPage[], origin: string = SITE_URL): string {
  const header = [
    `# azula — full documentation`,
    ``,
    `> ${SITE_SUMMARY}`,
    ``,
    `This is every page of ${origin} concatenated. Individual pages are listed in`,
    `${new URL("/llms.txt", origin).href}.`,
    ``,
  ].join("\n");

  const documents = pages.map((page) => {
    const body = stripComments(page.body).trim();
    // H1 per page, matching the standalone `.md` twin — the body's own
    // headings start at H2, so the hierarchy stays readable end to end.
    return [`---`, ``, `# ${page.title}`, ``, `Source: ${new URL(page.path, origin).href}`, ``, body, ``].join("\n");
  });

  return `${header}\n${documents.join("\n")}`;
}
