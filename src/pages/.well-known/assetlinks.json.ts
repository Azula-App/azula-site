import type { APIRoute } from "astro";
import { assetLinks } from "../../lib/wellknown";
import { json } from "../../lib/http";

// Android App Links association (host-scoped, no per-path entries needed).
export const prerender = false;

export const GET: APIRoute = () => json(assetLinks());
