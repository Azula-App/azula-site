import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * /privacy is not boilerplate — it is a set of factual claims about the shipped
 * code, and it is the URL the App Store and Play listings point at. The
 * disclosures pinned below are the ones that keep it honest: each is a real way
 * something leaves the device. Dropping one turns the page into a false claim,
 * so they are asserted here on purpose.
 *
 * The Markdown file is the page — /privacy renders it and /privacy.md serves
 * it — so asserting against the source asserts against both.
 */
const source = readFileSync(
  fileURLToPath(new URL("../content/pages/privacy.md", import.meta.url)),
  "utf-8",
);

// The file is hard-wrapped, so a claim can straddle a newline. Flatten
// whitespace before matching: the assertions are about the prose, not its
// line breaks.
const privacy = source.replace(/\s+/g, " ");

describe("privacy page", () => {
  it("states the headline claim: no accounts, no servers holding your data", () => {
    expect(privacy).toContain("no accounts and no servers that hold your data");
    expect(privacy).toContain("no analytics, telemetry, crash reporting or attribution SDK");
  });

  it("discloses the n0 relay + discovery metadata path", () => {
    expect(privacy).toContain("discovery service");
    expect(privacy).toContain("relay servers");
    expect(privacy).toMatch(/cannot read your messages/);
    expect(privacy).toContain("node ids are talking");
  });

  it("discloses that invite codes travel in the URL and reach Cloudflare's request logs", () => {
    expect(privacy).toContain("Cloudflare");
    expect(privacy).toContain("request logs");
    expect(privacy).toContain("bearer credential");
  });

  it("discloses OS backups and the plaintext desktop key file", () => {
    expect(privacy).toMatch(/operating system's own backup/);
    expect(privacy).toContain("not encrypted at rest");
  });

  it("discloses that a user-configured LLM provider sees what is routed to it", () => {
    expect(privacy).toContain("LLM provider");
    expect(privacy).toContain("MCP bridge");
  });

  it("still claims the site loads nothing but itself", () => {
    expect(privacy).toContain("loads nothing but itself");
  });

  it("publishes a privacy contact and a last-updated date", () => {
    expect(privacy).toContain("mailto:privacy@azula.app");
    expect(privacy).toMatch(/Last updated \d{1,2} \w+ \d{4}/);
  });
});
