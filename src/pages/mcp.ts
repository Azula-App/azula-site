import type { APIRoute } from "astro";
import { mcpInfo, mcpMethodNotSupported } from "../lib/mcp";

// Static MCP endpoint. Sessions are not encoded in the URL: configure this
// endpoint once in an MCP client, then pair a device by giving azula its link.
export const prerender = false;

export const GET: APIRoute = () => mcpInfo(false);
export const POST: APIRoute = () => mcpMethodNotSupported();
