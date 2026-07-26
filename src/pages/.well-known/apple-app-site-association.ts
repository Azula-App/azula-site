import type { APIRoute } from "astro";
import { appleAppSiteAssociation } from "../../lib/wellknown";
import { json } from "../../lib/http";

// iOS Universal Links association. Must be served as application/json with no
// redirect and no extension in the path — that contract is normative in
// azula-docs/openspec/specs/deeplinks/spec.md, which is why this is a Worker
// response rather than a static file whose content type would be guessed.
export const prerender = false;

export const GET: APIRoute = () => json(appleAppSiteAssociation());
