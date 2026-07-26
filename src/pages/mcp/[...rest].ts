import type { APIRoute } from "astro";
import { mcpInfo, mcpMethodNotSupported } from "../../lib/mcp";

// A token path (/mcp/<token>) is accepted but ignored, with a deprecation note.
export const prerender = false;

export const GET: APIRoute = () => mcpInfo(true);
export const POST: APIRoute = () => mcpMethodNotSupported();
