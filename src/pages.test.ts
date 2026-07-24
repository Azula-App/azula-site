import { describe, expect, it } from "vitest";
import { deviceLinkPage, invitePage, invitePageV2, landingPage, notFoundPage, privacyPage } from "./pages";
import type { InviteHeader, LinkHeader } from "./links";

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

// Device-link payload vector (multi-device-identity task 6.6) — see links.test.ts for how this
// was generated: device_pk = bytes 0x01..0x20, name = "My Laptop", a 32-byte opaque ticket.
const LINK_PAYLOAD =
  "azlaeaqeayeaudaocajbifqydiob4ibceqtcqkrmfyydenbwha5dypsacknpeqeyylqorxxaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
const LINK_HEADER: LinkHeader = {
  version: 1,
  devicePkHex: "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20",
  name: "My Laptop",
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

describe("privacyPage", () => {
  it("states the headline claim: no accounts, no servers holding your data", () => {
    const page = privacyPage();
    expect(page).toContain("no accounts and no servers that hold your data");
    expect(page).toContain("no analytics, telemetry, crash reporting or attribution SDK");
  });

  // The disclosures below are the ones that keep the page honest — the audit found
  // each of these is a real way something leaves the device. A change that drops one
  // turns this page into a false claim, so they're pinned here on purpose.
  it("discloses the n0 relay + discovery metadata path", () => {
    const page = privacyPage();
    expect(page).toContain("discovery service");
    expect(page).toContain("relay servers");
    expect(page).toMatch(/cannot read your messages/);
    expect(page).toContain("node ids are talking");
  });

  it("discloses that invite codes travel in the URL and reach Cloudflare's request logs", () => {
    const page = privacyPage();
    expect(page).toContain("Cloudflare");
    expect(page).toContain("request logs");
    expect(page).toContain("bearer credential");
  });

  it("discloses OS backups and the plaintext desktop key file", () => {
    const page = privacyPage();
    expect(page).toMatch(/operating system's own backup/);
    expect(page).toContain("not encrypted at rest");
  });

  it("discloses that a user-configured LLM provider sees what is routed to it", () => {
    const page = privacyPage();
    expect(page).toContain("LLM provider");
    expect(page).toContain("MCP bridge");
  });

  it("publishes a privacy contact and a last-updated date", () => {
    const page = privacyPage();
    expect(page).toContain("mailto:privacy@azula.app");
    expect(page).toMatch(/Last updated \d{1,2} \w+ \d{4}/);
  });
});

// The privacy page claims "a page here loads nothing but itself". That is only true
// while no page pulls in a third-party resource, so assert it for every page rather
// than trusting the claim.
describe("no third-party resource loads", () => {
  const pages: Array<[string, string]> = [
    ["landingPage", landingPage()],
    ["privacyPage", privacyPage()],
    ["invitePage", invitePage("abcdefgh12345")],
    ["invitePage (invalid)", invitePage(null)],
    ["invitePageV2", invitePageV2(V1_PAYLOAD, V2_HEADER)],
    ["deviceLinkPage", deviceLinkPage(LINK_PAYLOAD, LINK_HEADER)],
    ["deviceLinkPage (invalid)", deviceLinkPage(null, null)],
    ["notFoundPage", notFoundPage()],
  ];

  it.each(pages)("%s loads no external fonts, scripts, or stylesheets", (_name, page) => {
    expect(page).not.toContain("fonts.googleapis.com");
    expect(page).not.toContain("fonts.gstatic.com");
    // Any src=/href= pointing off-origin, other than plain hyperlinks (<a href>).
    const tags = page.match(/<(?:link|script|img|iframe)\b[^>]*>/g) ?? [];
    for (const tag of tags) {
      expect(tag).not.toMatch(/(?:href|src)\s*=\s*["']?(?:https?:)?\/\//);
    }
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

describe("deviceLinkPage", () => {
  it("renders the invalid-link view when payload/header are null", () => {
    const page = deviceLinkPage(null, null);
    expect(page).toContain("isn't valid");
    expect(page).not.toContain("azula://l");
  });

  it("renders the device name, appScheme link, and raw payload for a valid header", () => {
    const page = deviceLinkPage(LINK_PAYLOAD, LINK_HEADER);
    expect(page).toContain("Link a new device");
    expect(page).toContain("My Laptop");
    expect(page).toContain(`azula://l?c=${LINK_PAYLOAD}`);
    expect(page).toContain(LINK_PAYLOAD);
  });

  it("HTML-escapes the device name", () => {
    const page = deviceLinkPage(LINK_PAYLOAD, { ...LINK_HEADER, name: `ab&c<d>e"f'g` });
    expect(page).toContain("ab&amp;c&lt;d&gt;e&quot;f&#39;g");
  });

  it("does not claim this is an invite", () => {
    const page = deviceLinkPage(LINK_PAYLOAD, LINK_HEADER);
    expect(page).not.toContain("Accept an azula invite");
    expect(page).not.toContain("Join an azula session");
  });
});
