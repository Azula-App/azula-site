import { describe, expect, it } from "vitest";
import {
  decodeInviteHeader,
  decodeLinkPayloadHeader,
  deviceLinkAppScheme,
  inviteAppScheme,
  inviteTicketEndpointId,
  isValidInvitePayload,
  isValidLinkPayload,
  verifyInviteSignature,
} from "./links";

// Shared cross-repo test vectors (Kotlin `link` module, azula-cli's invite.rs, and
// this suite) — see azula-docs/openspec/specs/invitations/design.md "Test vectors". The ticket
// field is 32 opaque ASCII bytes, not a real ticket.
//
// V1 — unsigned, no expiry, multi-use (flags=0x00, expires_at=0).
const V1_ENCODED =
  "aziaeaaci2fm6e2xtppnfk3saaaaaaaaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
// V2 — signed, single-use, expires issued_at+86400 (flags=0x03, expires_at=1767312000).
const V2_ENCODED =
  "aziaebqci2fm6e2xtppnfk3sadjk4fiaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzz5oheqtxgf5642yvbxjxi3isnrlf3s6hhaoigqtcv2ygzh7vzusgb3vwkh462lv36uw5677ocbvwjax6qyehqsocbmznec563lgkja4";
// V1 with the version byte flipped to 0x02 (must be rejected).
const V1_VERSION_02 =
  "aziaiaaci2fm6e2xtppnfk3saaaaaaaaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
// V1 truncated mid-ticket (must be rejected).
const V1_TRUNCATED = "aziaeaaci2fm6e2xtppnfk3saaaaaaaaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bn";

// Device-link payload vector (multi-device-identity task 6.6 -- see
// azula-docs/openspec/specs/device-linking/spec.md) -- device_pk = bytes 0x01..0x20, name =
// "My Laptop", ticket = the same 32 opaque ASCII bytes the invite vectors use. Generated with a
// throwaway script implementing the exact layout below; not shared cross-repo (unlike the
// invite vectors), since this codec's canonical cross-language vectors live in the `link`
// module's / azula-cli's own test suites (task 2.4) -- this is purely a shape/decode check for
// the site's landing page.
const LINK_ENCODED =
  "azlaeaqeayeaudaocajbifqydiob4ibceqtcqkrmfyydenbwha5dypsacknpeqeyylqorxxaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
const LINK_DEVICE_PK_HEX = "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20";
// Same vector with the version byte flipped to 0x02 (must be rejected).
const LINK_BAD_VERSION =
  "azlaiaqeayeaudaocajbifqydiob4ibceqtcqkrmfyydenbwha5dypsacknpeqeyylqorxxaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";
// Same vector truncated mid-ticket (must be rejected).
const LINK_TRUNCATED =
  "azlaeaqeayeaudaocajbifqydiob4ibceqtcqkrmfyydenbwha5dypsacknpeqeyylqorxxaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foq";

describe("isValidInvitePayload", () => {
  it("accepts the V1 and V2 spec vectors", () => {
    expect(isValidInvitePayload(V1_ENCODED)).toBe(true);
    expect(isValidInvitePayload(V2_ENCODED)).toBe(true);
  });

  it("rejects strings without the azi prefix", () => {
    expect(isValidInvitePayload(V1_ENCODED.slice(1))).toBe(false);
    expect(isValidInvitePayload("xyz" + V1_ENCODED.slice(3))).toBe(false);
  });

  it("rejects uppercase or otherwise out-of-alphabet characters", () => {
    expect(isValidInvitePayload(V1_ENCODED.toUpperCase())).toBe(false);
    expect(isValidInvitePayload("azi" + "0".repeat(40))).toBe(false); // "0" and "1" aren't in the alphabet
  });

  it("rejects an empty payload and a bare azi prefix", () => {
    expect(isValidInvitePayload("")).toBe(false);
    expect(isValidInvitePayload("azi")).toBe(false);
  });
});

describe("decodeInviteHeader", () => {
  it("decodes the V1 vector (unsigned, no expiry, multi-use)", () => {
    const header = decodeInviteHeader(V1_ENCODED);
    expect(header).toEqual({
      version: 1,
      flags: 0,
      signed: false,
      singleUse: false,
      inviteId: "0123456789abcdef",
      issuedAt: 1767225600,
      expiresAt: 0,
      ticketLen: 32,
    });
  });

  it("decodes the V2 vector (signed, single-use, with expiry)", () => {
    const header = decodeInviteHeader(V2_ENCODED);
    expect(header).toEqual({
      version: 1,
      flags: 0x03,
      signed: true,
      singleUse: true,
      inviteId: "0123456789abcdef",
      issuedAt: 1767225600,
      expiresAt: 1767312000,
      ticketLen: 32,
    });
  });

  it("rejects a version byte of 0x02", () => {
    expect(decodeInviteHeader(V1_VERSION_02)).toBeNull();
  });

  it("rejects a payload truncated mid-ticket", () => {
    expect(decodeInviteHeader(V1_TRUNCATED)).toBeNull();
  });

  it("rejects malformed base32", () => {
    expect(decodeInviteHeader(V1_ENCODED.toUpperCase())).toBeNull();
  });

  it("rejects a non-invite string", () => {
    expect(decodeInviteHeader("not-an-invite")).toBeNull();
  });
});

describe("inviteAppScheme", () => {
  it("builds the azula://i deeplink with the payload URL-encoded", () => {
    expect(inviteAppScheme(V1_ENCODED)).toBe(`azula://i?c=${V1_ENCODED}`);
  });
});

describe("isValidLinkPayload", () => {
  it("accepts a well-formed device-link payload", () => {
    expect(isValidLinkPayload(LINK_ENCODED)).toBe(true);
  });

  it("rejects strings without the azl prefix", () => {
    expect(isValidLinkPayload(LINK_ENCODED.slice(1))).toBe(false);
    expect(isValidLinkPayload("azi" + LINK_ENCODED.slice(3))).toBe(false);
  });

  it("rejects uppercase or otherwise out-of-alphabet characters", () => {
    expect(isValidLinkPayload(LINK_ENCODED.toUpperCase())).toBe(false);
    expect(isValidLinkPayload("azl" + "0".repeat(40))).toBe(false); // "0"/"1" aren't in the alphabet
  });

  it("rejects an empty payload and a bare azl prefix", () => {
    expect(isValidLinkPayload("")).toBe(false);
    expect(isValidLinkPayload("azl")).toBe(false);
  });
});

describe("decodeLinkPayloadHeader", () => {
  it("decodes the device-link vector (version, device pk, name, ticket length)", () => {
    const header = decodeLinkPayloadHeader(LINK_ENCODED);
    expect(header).toEqual({
      version: 1,
      devicePkHex: LINK_DEVICE_PK_HEX,
      name: "My Laptop",
      ticketLen: 32,
    });
  });

  it("rejects a version byte of 0x02", () => {
    expect(decodeLinkPayloadHeader(LINK_BAD_VERSION)).toBeNull();
  });

  it("rejects a payload truncated mid-ticket", () => {
    expect(decodeLinkPayloadHeader(LINK_TRUNCATED)).toBeNull();
  });

  it("rejects malformed base32", () => {
    expect(decodeLinkPayloadHeader(LINK_ENCODED.toUpperCase())).toBeNull();
  });

  it("rejects a non-link string", () => {
    expect(decodeLinkPayloadHeader("not-a-link")).toBeNull();
    expect(decodeLinkPayloadHeader(V1_ENCODED)).toBeNull(); // an invite payload, wrong prefix
  });
});

describe("deviceLinkAppScheme", () => {
  it("builds the azula://l deeplink with the payload URL-encoded", () => {
    expect(deviceLinkAppScheme(LINK_ENCODED)).toBe(`azula://l?c=${LINK_ENCODED}`);
  });
});

// --- Real-ticket vectors (the shared V1/V2 vectors above carry a *fake* 32-byte
// ASCII ticket, so they can't exercise key recovery). Generated from azula-cli:
// a signed, never-expiring invite minted by endpoint key [7u8; 32] for its own
// EndpointTicket, which carries a relay URL and one IPv4 direct address.
const REAL_ENDPOINT_ID_HEX = "ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c";
const REAL_SIGNED_ENCODED =
  "aziaea5fl7nw5yfg3aznj4pz6iaaaaaaacdadveu3dd4kofecv66vihwezoyx4zkr3wv27l464siipou2iui3jcyaqaczuhi5dqom5c6l3smvwgc6jomv4gc3lqnrss6aiaycuaclesyibeloazywaf5awcyi4bhlzcmb7ires5hav3kc4pto6lf4fh4c3vtxsyyrkdpf3qm2xwffz2hkjbnusmp4uvpu6azrs73eedpu2ewdz4b4";

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** The same payload with its final base32 char changed: same length, same
 *  header and ticket, different trailing signature bits. */
const REAL_SIGNED_TAMPERED =
  REAL_SIGNED_ENCODED.slice(0, -1) + (REAL_SIGNED_ENCODED.endsWith("a") ? "b" : "a");

describe("inviteTicketEndpointId", () => {
  it("recovers the issuer endpoint id from a real ticket", () => {
    const pk = inviteTicketEndpointId(REAL_SIGNED_ENCODED);
    expect(pk).not.toBeNull();
    expect(toHex(pk!)).toBe(REAL_ENDPOINT_ID_HEX);
  });

  it("stays at a fixed offset regardless of how many addresses the ticket carries", () => {
    // The vector's ticket has a relay URL *and* a direct address after the id.
    expect(toHex(inviteTicketEndpointId(REAL_SIGNED_ENCODED)!)).toBe(REAL_ENDPOINT_ID_HEX);
  });

  it("returns null for a payload that does not decode", () => {
    expect(inviteTicketEndpointId("azinotvalid")).toBeNull();
    expect(inviteTicketEndpointId("")).toBeNull();
  });

  it("returns null when the ticket is too short to hold a key", () => {
    // The shared V1 vector's ticket is 32 ASCII bytes -- one short of the
    // tag + 32-byte key a real ticket starts with.
    expect(inviteTicketEndpointId(V1_ENCODED)).toBeNull();
  });
});

describe("verifyInviteSignature", () => {
  it("verifies a real signed invite against its own embedded ticket key", async () => {
    await expect(verifyInviteSignature(REAL_SIGNED_ENCODED)).resolves.toBe(true);
  });

  it("rejects a tampered signature", async () => {
    // Must fail on the signature itself, not by failing to decode -- otherwise
    // this would pass for the wrong reason.
    expect(decodeInviteHeader(REAL_SIGNED_TAMPERED)).not.toBeNull();
    expect(toHex(inviteTicketEndpointId(REAL_SIGNED_TAMPERED)!)).toBe(REAL_ENDPOINT_ID_HEX);
    await expect(verifyInviteSignature(REAL_SIGNED_TAMPERED)).resolves.toBe(false);
  });

  it("returns false for an unsigned invite rather than claiming verification", async () => {
    await expect(verifyInviteSignature(V1_ENCODED)).resolves.toBe(false);
  });

  it("returns false for a payload that does not decode", async () => {
    await expect(verifyInviteSignature("azinotvalid")).resolves.toBe(false);
  });

  it("returns false for the shared V2 vector, whose ticket is not a real one", async () => {
    // Signed by the RFC 8032 TEST 1 key over a fake ASCII ticket: there is no
    // recoverable endpoint key, so it must fail closed rather than throw.
    await expect(verifyInviteSignature(V2_ENCODED)).resolves.toBe(false);
  });
});
