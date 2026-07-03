import { describe, expect, it } from "vitest";
import { appScheme, isValidToken, sessionFingerprint } from "./links";

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
