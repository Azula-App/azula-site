import { describe, expect, it } from "vitest";
import worker, { type Env } from "./index";

const env = {} as Env;

// Shared cross-repo vector — see azula-docs/docs/invitations.md and links.test.ts.
// V1 — unsigned, no expiry, multi-use.
const V1_INVITE_ENCODED =
  "aziaeaaci2fm6e2xtppnfk3saaaaaaaaabamf5hk3dbfv2gk43ufvsw4zdqn5uw45bnoruwg23foqwwe6lumvzq";

async function get(path: string, init?: RequestInit): Promise<Response> {
  return worker.fetch(new Request(`https://azula.app${path}`, init), env);
}

describe("routing", () => {
  it("GET / returns the landing page", async () => {
    const res = await get("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain("<!doctype html>");
    expect(body).toContain("azula");
  });

  it("GET /privacy returns the privacy policy", async () => {
    const res = await get("/privacy");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const body = await res.text();
    expect(body).toContain("no accounts and no servers that hold your data");
  });

  it("links the privacy policy from the landing page", async () => {
    const body = await (await get("/")).text();
    expect(body).toContain('href="/privacy"');
  });

  it("GET /health returns ok", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("GET /s/<valid-token> returns 200 with the invite page, token, and appScheme link", async () => {
    const token = "abcdefgh12345";
    const res = await get(`/s/${token}`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain(token);
    expect(body).toContain(`azula://connect?code=${token}`);
  });

  it("GET /connect/<token> behaves the same as /s/<token>", async () => {
    const token = "abcdefgh12345";
    const [sRes, connectRes] = await Promise.all([get(`/s/${token}`), get(`/connect/${token}`)]);
    expect(connectRes.status).toBe(sRes.status);
    expect(await connectRes.text()).toBe(await sRes.text());
  });

  it("GET /s/<invalid-token> falls back to the invalid-link page with 404", async () => {
    // "a" is below the 6-char minimum enforced by isValidToken.
    const res = await get("/s/a");
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain("isn't valid");
  });

  it("GET /i/<valid-payload> returns 200 with the invite page v2", async () => {
    const res = await get(`/i/${V1_INVITE_ENCODED}`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Accept an azula invite");
    expect(body).toContain("0123456789abcdef");
    expect(body).toContain(`azula://i?c=${V1_INVITE_ENCODED}`);
    expect(body).toContain(V1_INVITE_ENCODED);
  });

  it("GET /i/<invalid-payload> falls back to the invalid-link page with 404", async () => {
    const res = await get("/i/not-an-invite");
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain("isn't valid");
  });

  it("GET /i/<truncated-payload> falls back to the invalid-link page with 404", async () => {
    const res = await get(`/i/${V1_INVITE_ENCODED.slice(0, -20)}`);
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain("isn't valid");
  });

  it("GET /mcp returns the JSON placeholder", async () => {
    const res = await get("/mcp");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toMatchObject({ service: "azula-mcp", transport: "streamable-http", status: "placeholder" });
    expect(data).not.toHaveProperty("note");
  });

  it("POST /mcp returns a 501 JSON-RPC error", async () => {
    const res = await get("/mcp", { method: "POST" });
    expect(res.status).toBe(501);
    const data = (await res.json()) as Record<string, unknown>;
    expect(data).toMatchObject({ jsonrpc: "2.0", id: null, error: { code: -32601 } });
  });

  it("GET /mcp/<token> includes the deprecation note", async () => {
    const res = await get("/mcp/sometoken");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { note: string };
    expect(data.note).toMatch(/deprecated/);
  });

  it("GET /unknown/path returns 404", async () => {
    const res = await get("/unknown/path");
    expect(res.status).toBe(404);
    const body = await res.text();
    expect(body).toContain("404");
  });

  it("sets security headers on HTML responses", async () => {
    const res = await get("/");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  });

  it("serves the apple-app-site-association file as application/json", async () => {
    const res = await get("/.well-known/apple-app-site-association");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = (await res.json()) as any;
    expect(data.applinks.details[0].components).toEqual(
      expect.arrayContaining([expect.objectContaining({ "/": "/s/*" })]),
    );
  });

  it("serves assetlinks.json as application/json", async () => {
    const res = await get("/.well-known/assetlinks.json");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
