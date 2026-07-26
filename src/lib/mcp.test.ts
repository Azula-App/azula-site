import { describe, expect, it } from "vitest";
import { mcpInfo, mcpMethodNotSupported } from "./mcp";

describe("mcpInfo", () => {
  it("points at the local server and the setup docs, not at this worker", async () => {
    const body = (await mcpInfo(false).json()) as Record<string, unknown>;
    expect(body.status).toBe("placeholder");
    expect(body.docs).toBe("https://azula.app/docs/mcp");
    expect(String(body.message)).toContain("azula mcp");
    expect(body.note).toBeUndefined();
  });

  it("adds a deprecation note when a token rode in the path", async () => {
    const body = (await mcpInfo(true).json()) as Record<string, unknown>;
    expect(String(body.note)).toContain("deprecated");
  });
});

describe("mcpMethodNotSupported", () => {
  it("answers a misdirected MCP client with a JSON-RPC error, not an HTML page", async () => {
    const response = mcpMethodNotSupported();
    expect(response.status).toBe(501);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = (await response.json()) as { jsonrpc: string; error: { code: number } };
    expect(body.jsonrpc).toBe("2.0");
    expect(body.error.code).toBe(-32601);
  });
});
