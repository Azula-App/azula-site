import { defineMiddleware } from "astro:middleware";
import { SECURITY_HEADERS } from "./lib/http";

/**
 * Security headers for everything the Worker renders on demand.
 *
 * Prerendered pages and assets get theirs from public/_headers, which Workers
 * Assets applies — but that never runs for a Worker response, so the deeplink
 * pages would otherwise go out bare. Also pins the charset on HTML: Astro sets
 * a plain `text/html`, and a device-link page can carry a UTF-8 device name.
 */
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  if (!response.headers.has("X-Frame-Options")) response.headers.set("X-Frame-Options", "DENY");

  if (response.headers.get("content-type") === "text/html") {
    response.headers.set("content-type", "text/html; charset=utf-8");
  }

  return response;
});
