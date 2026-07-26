import { describe, expect, it } from "vitest";
import { llmsFull, llmsIndex, markdownDocument, markdownPath, markdownUrl, type MarkdownPage } from "./llms";
import { REPOS } from "./site";

const HOME: MarkdownPage = {
  path: "/",
  title: "azula",
  description: "Peer-to-peer over iroh.",
  body: "azula links two devices straight to each other.",
};

const CLI: MarkdownPage = {
  path: "/docs/cli",
  title: "Using the CLI",
  description: "The noun-verb command surface.",
  body: "<!-- an editor note -->\n\n`azula` is a noun-verb CLI.",
};

const PRIVACY: MarkdownPage = {
  path: "/privacy",
  title: "Privacy",
  description: "No accounts, no servers holding your data.",
  body: "That is the whole policy.",
};

describe("markdownPath / markdownUrl", () => {
  it("maps the home page to /index.md and everything else to path + .md", () => {
    expect(markdownPath("/")).toBe("/index.md");
    expect(markdownPath("/privacy")).toBe("/privacy.md");
    expect(markdownPath("/docs")).toBe("/docs.md");
    expect(markdownPath("/docs/cli")).toBe("/docs/cli.md");
  });

  it("builds absolute URLs against the given origin", () => {
    expect(markdownUrl("/docs/cli", "https://azula.app")).toBe("https://azula.app/docs/cli.md");
    expect(markdownUrl("/", "http://localhost:4321")).toBe("http://localhost:4321/index.md");
  });
});

describe("markdownDocument", () => {
  it("prefixes the title and description, then the body verbatim", () => {
    const doc = markdownDocument(CLI);
    expect(doc.startsWith("# Using the CLI\n\n> The noun-verb command surface.\n\n")).toBe(true);
    expect(doc).toContain("`azula` is a noun-verb CLI.");
  });

  // Editor notes in the source (the privacy page carries one) are not content.
  it("strips HTML comments", () => {
    expect(markdownDocument(CLI)).not.toContain("an editor note");
  });
});

describe("llmsIndex", () => {
  const index = llmsIndex({ docs: [CLI], pages: [HOME, PRIVACY], origin: "https://azula.app" });

  it("follows the llms.txt shape: H1 name, blockquote summary, link sections", () => {
    const lines = index.split("\n");
    expect(lines[0]).toBe("# azula");
    expect(lines[2].startsWith("> ")).toBe(true);
    expect(index).toContain("## Docs");
    expect(index).toContain("## Source");
    expect(index).toContain("## Optional");
  });

  it("links to the .md twin of every page, with its one-line note", () => {
    expect(index).toContain("- [Using the CLI](https://azula.app/docs/cli.md): The noun-verb command surface.");
    expect(index).toContain("- [azula](https://azula.app/index.md): Peer-to-peer over iroh.");
    expect(index).toContain("- [Privacy](https://azula.app/privacy.md): No accounts, no servers holding your data.");
  });

  it("puts the home page in Docs and the rest under Reference", () => {
    const docsSection = index.slice(index.indexOf("## Docs"), index.indexOf("## Reference"));
    expect(docsSection).toContain("/index.md");
    expect(docsSection).toContain("/docs/cli.md");
    expect(docsSection).not.toContain("/privacy.md");
  });

  it("lists every repo so an agent can find the source", () => {
    for (const repo of REPOS) expect(index).toContain(repo.url);
  });

  it("honours a non-production origin, so a dev build never advertises azula.app", () => {
    const local = llmsIndex({ docs: [CLI], pages: [HOME], origin: "http://localhost:8788" });
    expect(local).toContain("http://localhost:8788/docs/cli.md");
    expect(local).not.toContain("https://azula.app/docs/cli.md");
  });
});

describe("llmsFull", () => {
  const full = llmsFull([HOME, CLI, PRIVACY], "https://azula.app");

  it("includes every page's body and its source URL", () => {
    expect(full).toContain("# Using the CLI");
    expect(full).toContain("Source: https://azula.app/docs/cli");
    expect(full).toContain("`azula` is a noun-verb CLI.");
    expect(full).toContain("That is the whole policy.");
  });

  it("points back at the index and strips editor notes", () => {
    expect(full).toContain("https://azula.app/llms.txt");
    expect(full).not.toContain("an editor note");
  });
});
