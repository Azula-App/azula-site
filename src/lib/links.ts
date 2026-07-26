// A session token is an iroh EndpointTicket string (or a future short id). It is
// URL-safe and treated opaquely here — only the Azula app and the MCP↔iroh
// bridge decode it. See URLS.md for the full scheme.

const TOKEN_RE = /^[A-Za-z0-9._~-]{6,4096}$/;

export function isValidToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

/** Short, display-only id for a session (not security-sensitive). */
export function sessionFingerprint(token: string): string {
  return token.slice(0, 8).toLowerCase();
}

/** The canonical custom-scheme deeplink the legacy invite page tries to open. */
export function appScheme(token: string): string {
  return `azula://connect?code=${encodeURIComponent(token)}`;
}

// --- Invite payload v2 (see azula-docs/openspec/specs/invitations/design.md) ---------------
//
// Binary header, all integers big-endian:
//   0   1  version      0x01; reject anything else
//   1   1  flags        bit0 signed, bit1 single-use, bits2-7 reserved (ignored on decode)
//   2   8  invite_id    random nonce; lowercase-hex render is the display fingerprint
//   10  4  issued_at    unix seconds, u32
//   14  4  expires_at   unix seconds, u32; 0 = never expires
//   18  2  ticket_len   = n
//   20  n  ticket       opaque to this codec
//   20+n 64 signature   present iff flags bit0; Ed25519, opaque to this codec
//
// Encoded as "azi" + base32(payload), RFC 4648 alphabet, no padding, lowercase.

const B32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const B32_LOOKUP: Record<string, number> = {};
for (let i = 0; i < B32_ALPHABET.length; i++) B32_LOOKUP[B32_ALPHABET[i]] = i;

const INVITE_HEADER_MIN_BYTES = 20; // header with a zero-length ticket, unsigned
const INVITE_PREFIX = "azi";
// "azi" + base32 body. Body length is bounds-checked loosely here (cheap syntactic
// filter); decodeInviteHeader does the exact structural validation.
const INVITE_PAYLOAD_RE = /^azi[a-z2-7]{32,4093}$/;

export function isValidInvitePayload(s: string): boolean {
  return INVITE_PAYLOAD_RE.test(s);
}

/** RFC 4648 base32 decode (lowercase, no padding). Returns null on any invalid character. */
function b32decode(s: string): Uint8Array | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of s) {
    const v = B32_LOOKUP[c];
    if (v === undefined) return null;
    value = (value << 5) | v;
    bits += 5;
    while (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  // Any leftover bits must be zero-valued padding, and there can be at most 4 of
  // them (a valid unpadded base32 tail never leaves 5+ bits unconsumed).
  if (bits >= 5) return null;
  if (bits > 0 && (value & ((1 << bits) - 1)) !== 0) return null;
  return new Uint8Array(out);
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function readU32BE(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0
  );
}

function readU16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export interface InviteHeader {
  version: number;
  flags: number;
  signed: boolean;
  singleUse: boolean;
  /** Lowercase-hex display fingerprint (8 bytes → 16 hex chars). */
  inviteId: string;
  issuedAt: number;
  expiresAt: number;
  ticketLen: number;
}

/**
 * Decodes and structurally validates the fixed-offset header of an invite
 * payload (the `"azi" + base32(...)` encoded form). Does not decode or
 * inspect the opaque ticket/signature bytes beyond checking total length.
 * Returns null on any inconsistency (bad encoding, wrong version, truncated
 * payload, ticket_len overrun, missing signature when the signed flag is set).
 */
export function decodeInviteHeader(payload: string): InviteHeader | null {
  if (!isValidInvitePayload(payload)) return null;
  const bytes = b32decode(payload.slice(INVITE_PREFIX.length));
  if (bytes === null || bytes.length < INVITE_HEADER_MIN_BYTES) return null;

  const version = bytes[0];
  if (version !== 1) return null;

  const flags = bytes[1];
  const signed = (flags & 0x01) !== 0;
  const singleUse = (flags & 0x02) !== 0;
  const inviteId = toHex(bytes.slice(2, 10));
  const issuedAt = readU32BE(bytes, 10);
  const expiresAt = readU32BE(bytes, 14);
  const ticketLen = readU16BE(bytes, 18);

  const expectedLen = INVITE_HEADER_MIN_BYTES + ticketLen + (signed ? 64 : 0);
  if (bytes.length !== expectedLen) return null;

  return { version, flags, signed, singleUse, inviteId, issuedAt, expiresAt, ticketLen };
}

/** The canonical custom-scheme deeplink the invite page v2 tries to open. */
export function inviteAppScheme(payload: string): string {
  return `azula://i?c=${encodeURIComponent(payload)}`;
}

// --- Device-link payload (see azula-docs/openspec/specs/device-linking/spec.md, multi-device-identity
// task 6.6) ------------------------------------------------------------------------------------
//
// Binary header, all integers big-endian:
//   0   1  version      0x01; reject anything else
//   1   32 device_pk    the new device's Ed25519 public key
//   33  1  name_len     = n
//   34  n  name         UTF-8 device name, shown to the root-holding device before granting
//   34+n 2  ticket_len  = m
//   36+n m  ticket      opaque connect ticket; opaque to this codec
//
// Encoded as "azl" + base32(payload), same RFC 4648 alphabet/rules as the invite payload
// above. This is purely a URL wrapper around the payload `core/DeviceCert.kt`'s
// `LinkPayloadCodec` (Kotlin) and `azula-cli/src/certs.rs` (Rust) already produce — this file
// never mints or verifies a certificate, only decodes enough of the header to render the
// landing page.

const LINK_HEADER_MIN_BYTES = 36; // header with zero-length name and ticket
const LINK_PREFIX = "azl";
// "azl" + base32 body. Body length is bounds-checked loosely here (cheap syntactic
// filter); decodeLinkPayloadHeader does the exact structural validation.
const LINK_PAYLOAD_RE = /^azl[a-z2-7]{32,4093}$/;

export function isValidLinkPayload(s: string): boolean {
  return LINK_PAYLOAD_RE.test(s);
}

export interface LinkHeader {
  version: number;
  /** Lowercase-hex render of the new device's public key. */
  devicePkHex: string;
  /** UTF-8 device name the new device chose (e.g. "My laptop"). */
  name: string;
  ticketLen: number;
}

/**
 * Decodes and structurally validates the fixed-offset header of a device-link payload (the
 * `"azl" + base32(...)` encoded form). Does not decode or inspect the opaque ticket bytes
 * beyond checking total length. Returns null on any inconsistency (bad encoding, wrong
 * version, truncated payload, a name_len/ticket_len that overruns the payload, or a name that
 * isn't valid UTF-8).
 */
export function decodeLinkPayloadHeader(payload: string): LinkHeader | null {
  if (!isValidLinkPayload(payload)) return null;
  const bytes = b32decode(payload.slice(LINK_PREFIX.length));
  if (bytes === null || bytes.length < LINK_HEADER_MIN_BYTES) return null;

  const version = bytes[0];
  if (version !== 1) return null;

  const devicePk = bytes.slice(1, 33);
  const nameLen = bytes[33];
  const nameStart = 34;
  const nameEnd = nameStart + nameLen;
  if (nameEnd + 2 > bytes.length) return null;
  const ticketLen = readU16BE(bytes, nameEnd);

  const expectedLen = nameEnd + 2 + ticketLen;
  if (bytes.length !== expectedLen) return null;

  let name: string;
  try {
    name = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes.slice(nameStart, nameEnd));
  } catch {
    return null;
  }

  return { version, devicePkHex: toHex(devicePk), name, ticketLen };
}

/** The canonical custom-scheme deeplink the device-link page tries to open. */
export function deviceLinkAppScheme(payload: string): string {
  return `azula://l?c=${encodeURIComponent(payload)}`;
}
