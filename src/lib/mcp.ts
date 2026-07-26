import { json } from "./http";

/**
 * The /mcp placeholder response.
 *
 * Workers cannot open iroh connections (no raw UDP/QUIC, no long-lived
 * holepunched sockets), so the real MCP server is `azula mcp` running on the
 * user's own machine — see /docs/mcp. This endpoint exists to say so, and to
 * keep the historical URL from 404ing.
 */
export function mcpInfo(deprecatedTokenPath: boolean): Response {
  return json({
    service: "azula-mcp",
    transport: "streamable-http",
    status: "placeholder",
    ...(deprecatedTokenPath
      ? {
          note:
            "tokens in the MCP URL are deprecated — configure the static /mcp endpoint and pair " +
            "devices with the connect tool or `azula pair <url>`.",
        }
      : {}),
    message:
      "The azula MCP server runs on your machine, not here: `azula mcp` (stdio) or " +
      "`azula mcp --http <bind>`. Configure it once in your LLM client, then pair a device by " +
      "giving azula its invite link (the connect tool, or `azula pair <url>`). " +
      "Setup instructions: https://azula.app/docs/mcp",
    docs: "https://azula.app/docs/mcp",
  });
}

/** POST here is someone pointing an MCP client at the wrong address. Say so. */
export function mcpMethodNotSupported(): Response {
  return json(
    {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32601,
        message: "the azula MCP server is `azula mcp` on your own machine, not this worker",
        data: { docs: "https://azula.app/docs/mcp" },
      },
    },
    501,
  );
}
