import { describe, expect, it } from "vitest";
import { invitePage, landingPage, notFoundPage } from "./pages";

// escapeHtml isn't exported, so we exercise it through invitePage, which HTML-escapes
// the raw token into the page body.
describe("escapeHtml (via invitePage)", () => {
  it("escapes all five special entities in the raw token rendered at the bottom", () => {
    // Note: the short "session" fingerprint above it is deliberately unescaped raw
    // text (see sessionFingerprint's doc comment) — only the full raw token here
    // goes through escapeHtml.
    const page = invitePage(`ab&c<d>e"f'g-000000`);
    expect(page).toContain("ab&amp;c&lt;d&gt;e&quot;f&#39;g-000000");
  });
});

describe("landingPage", () => {
  it("renders the brand and MCP/session copy", () => {
    const page = landingPage();
    expect(page).toContain("<!doctype html>");
    expect(page).toContain("azula");
    expect(page).toContain("LLM via MCP");
  });
});

describe("invitePage", () => {
  it("renders the invalid-link view when token is null", () => {
    const page = invitePage(null);
    expect(page).toContain("isn't valid");
    expect(page).not.toContain("azula://connect");
  });

  it("renders the join view with the appScheme link and fingerprint for a valid token", () => {
    const page = invitePage("abcdefgh12345");
    expect(page).toContain("azula://connect?code=abcdefgh12345");
    expect(page).toContain("abcdefgh"); // sessionFingerprint
    expect(page).toContain("Join an azula session");
  });
});

describe("notFoundPage", () => {
  it("renders a 404 page", () => {
    expect(notFoundPage()).toContain("404");
  });
});
