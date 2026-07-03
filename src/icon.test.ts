import { describe, expect, it } from "vitest";
import { b64ToBytes } from "./icon";

describe("b64ToBytes", () => {
  it("round-trips a known vector ('hello' -> aGVsbG8=)", () => {
    const bytes = b64ToBytes("aGVsbG8=");
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
    expect(new TextDecoder().decode(bytes)).toBe("hello");
  });

  it("decodes an empty string to an empty byte array", () => {
    expect(b64ToBytes("").length).toBe(0);
  });

  it("decodes binary data (0x00-0xff round trip)", () => {
    const original = new Uint8Array([0, 1, 2, 254, 255]);
    const b64 = btoa(String.fromCharCode(...original));
    expect(Array.from(b64ToBytes(b64))).toEqual(Array.from(original));
  });
});
