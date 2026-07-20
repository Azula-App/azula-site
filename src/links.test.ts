import { describe, expect, it } from "vitest";
import { appScheme, decodeInviteHeader, inviteAppScheme, isValidInvitePayload, isValidToken, sessionFingerprint } from "./links";

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

describe("isValidToken", () => {
  it("accepts a minimal 6-char URL-safe token", () => {
    expect(isValidToken("abc123")).toBe(true);
  });

  it("accepts a token with all allowed characters", () => {
    expect(isValidToken("abcDEF123._~-")).toBe(true);
  });

  it("accepts a 4096-char token (upper bound)", () => {
    expect(isValidToken("a".repeat(4096))).toBe(true);
  });

  it("rejects a token shorter than 6 chars", () => {
    expect(isValidToken("abcde")).toBe(false);
  });

  it("rejects a token longer than 4096 chars", () => {
    expect(isValidToken("a".repeat(4097))).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidToken("")).toBe(false);
  });

  it("rejects tokens with invalid characters", () => {
    expect(isValidToken("abc/def")).toBe(false);
    expect(isValidToken("abc def")).toBe(false);
    expect(isValidToken("abc+def")).toBe(false);
    expect(isValidToken("abc?def")).toBe(false);
    expect(isValidToken("<script>")).toBe(false);
  });
});

describe("sessionFingerprint", () => {
  it("returns the first 8 chars lowercased", () => {
    expect(sessionFingerprint("ABCDEFGHIJKL")).toBe("abcdefgh");
  });

  it("handles tokens shorter than 8 chars", () => {
    expect(sessionFingerprint("AbC123")).toBe("abc123");
  });
});

describe("appScheme", () => {
  it("builds the azula:// deeplink with the token URL-encoded", () => {
    expect(appScheme("abc123")).toBe("azula://connect?code=abc123");
  });

  it("URL-encodes special characters in the token", () => {
    expect(appScheme("a b&c")).toBe("azula://connect?code=a%20b%26c");
  });
});

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
