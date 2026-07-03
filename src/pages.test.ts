import { describe, expect, it } from "vitest";
import { invitePage, invitePageV2, landingPage, notFoundPage } from "./pages";
import type { InviteHeader } from "./links";

const V1_PAYLOAD =
  "aziaeaaci2fm6e2xtppnfk3saaaaaaaaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
const V1_HEADER: InviteHeader = {
  version: 1,
  flags: 0,
  signed: false,
  singleUse: false,
  inviteId: "0123456789abcdef",
  issuedAt: 1767225600,
  expiresAt: 0,
  ticketLen: 32,
};
const V2_HEADER: InviteHeader = {
  version: 1,
  flags: 0x03,
  signed: true,
  singleUse: true,
  inviteId: "0123456789abcdef",
  issuedAt: 1767225600,
  expiresAt: 1767312000,
  ticketLen: 32,
};

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

describe("invitePageV2", () => {
  it("renders the invite id fingerprint, appScheme link, and raw payload", () => {
    const page = invitePageV2(V1_PAYLOAD, V1_HEADER);
    expect(page).toContain("Accept an azula invite");
    expect(page).toContain(V1_HEADER.inviteId);
    expect(page).toContain(`azula://i?c=${V1_PAYLOAD}`);
    expect(page).toContain(V1_PAYLOAD);
  });

  it("shows no signed/single-use badges and 'no expiry' for an unsigned, multi-use, never-expiring invite", () => {
    const page = invitePageV2(V1_PAYLOAD, V1_HEADER);
    expect(page).not.toContain("signed");
    expect(page).not.toContain("single-use");
    expect(page).toContain("no expiry");
  });

  it("shows signed and single-use badges for a signed, single-use invite", () => {
    const page = invitePageV2(V1_PAYLOAD, V2_HEADER);
    expect(page).toContain("signed");
    expect(page).toContain("single-use");
    expect(page).toContain("does not verify the");
  });

  it("does not claim to verify the signature on this page", () => {
    const page = invitePageV2(V1_PAYLOAD, V2_HEADER);
    expect(page).toMatch(/does not verify the\s+signature/);
  });
});
