/** Site-wide constants shared by pages, endpoints and the llms.txt builders. */

export const SITE_URL = "https://azula.app";

/** One-line summary. Used as the `>` blurb at the top of /llms.txt. */
export const SITE_SUMMARY =
  "azula links two devices directly over iroh — UDP holepunched, QUIC encrypted, " +
  "no account and no server in the middle. Chat with a peer, drive a remote shell, " +
  "or bridge an MCP-capable LLM into a session over the same direct link.";

export const GITHUB_ORG = "https://github.com/Azula-App";

/**
 * The public path for a page, whatever shape the build gave us. `build.format:
 * "file"` makes Astro.url.pathname "/docs.html" at prerender time, and the
 * dev server serves "/docs" — canonical URLs and rel=alternate links must not
 * depend on which one we're in.
 */
export function canonicalPath(pathname: string): string {
  const clean = pathname.replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

export interface Repo {
  name: string;
  url: string;
  blurb: string;
}

/** The public repos, in the order they're useful to someone arriving cold. */
export const REPOS: Repo[] = [
  {
    name: "azula-cli",
    url: "https://github.com/Azula-App/azula-cli",
    blurb: "The Rust CLI and MCP server — `azula mcp`, `azula run`, `azula terminal`, `azula relay`.",
  },
  {
    name: "azula-app",
    url: "https://github.com/Azula-App/azula-app",
    blurb: "The Kotlin Multiplatform / Compose app for Android, iOS and desktop.",
  },
  {
    name: "iroh-kmp",
    url: "https://github.com/Azula-App/iroh-kmp",
    blurb: "Kotlin Multiplatform bindings for iroh (`app.azula.iroh`), the transport the app runs on.",
  },
  {
    name: "azula-site",
    url: "https://github.com/Azula-App/azula-site",
    blurb: "This site — an Astro build deployed to Cloudflare Workers.",
  },
  {
    name: "azula-docs",
    url: "https://github.com/Azula-App/azula-docs",
    blurb: "Cross-repo specifications and design notes, as an OpenSpec tree.",
  },
];

/** Store links. Placeholders until the apps are published. */
export const STORE_LINKS = {
  ios: { label: "App Store (soon)", href: "#ios-not-published" },
  android: { label: "Google Play (soon)", href: "#android-not-published" },
} as const;
