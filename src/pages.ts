import { appScheme, sessionFingerprint } from "./links";

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">';

const STYLE = `
  :root{--pink:#ff2d9b;--pink2:#ff6ec7;--green:#52c98a;--bg0:#070709;--bg1:#0a0a10;--bg2:#0c0c13;
    --line:#1d1d26;--line2:#23232e;--t0:#f0f0f6;--t1:#d6d6e0;--dim:#8a8a9a;--faint:#6a6a7a}
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(120% 80% at 50% -10%,#120a18,var(--bg0));color:var(--t1);
    font:15px/1.6 'Space Grotesk',system-ui,sans-serif;min-height:100vh}
  a{color:var(--pink2);text-decoration:none}
  .wrap{max-width:880px;margin:0 auto;padding:48px 22px 64px}
  .brand{font:700 30px 'Space Grotesk';color:var(--pink);text-shadow:0 0 16px rgba(255,45,155,.4);letter-spacing:-.5px}
  .tag{font:12px 'JetBrains Mono';color:var(--faint);margin-top:2px;letter-spacing:1px}
  .hero{margin-top:40px}
  .hero h1{font:700 40px/1.15 'Space Grotesk';color:var(--t0);margin:0 0 14px}
  .hero p{font-size:17px;color:var(--t1);max-width:620px}
  .pill{display:inline-flex;align-items:center;gap:7px;font:11px 'JetBrains Mono';color:var(--green);
    border:1px solid var(--line2);border-radius:999px;padding:5px 11px;margin-top:18px}
  .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
  .btn{display:inline-block;padding:12px 18px;border-radius:11px;font-weight:600;font-size:14px}
  .btn.primary{background:linear-gradient(135deg,var(--pink),#c4156e);color:#fff;box-shadow:0 0 18px rgba(255,45,155,.4)}
  .btn.ghost{border:1px solid var(--line2);color:var(--t1)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:46px}
  .card{background:var(--bg2);border:1px solid var(--line);border-radius:14px;padding:18px}
  .card h3{margin:0 0 6px;font-size:16px;color:var(--t0)}
  .card p{margin:0;font-size:13.5px;color:var(--dim)}
  .glyph{font:18px 'JetBrains Mono';color:var(--pink2);margin-bottom:8px}
  .sec{margin-top:48px}
  .sec h2{font-size:20px;color:var(--t0)}
  code{font:13px 'JetBrains Mono';background:#1a1a23;border:1px solid var(--line2);border-radius:5px;padding:2px 6px;color:var(--pink2)}
  pre{background:var(--bg0);border:1px solid var(--line2);border-radius:10px;padding:14px;overflow:auto}
  pre code{background:none;border:none;padding:0;color:#cdd6e0;font-size:12.5px}
  .codebox{display:flex;align-items:center;gap:10px;background:var(--bg2);border:1px solid var(--line2);
    border-radius:11px;padding:13px 15px;margin-top:18px;word-break:break-all}
  .codebox .k{font:13px 'JetBrains Mono';color:var(--pink2)}
  footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--line);font:12px 'JetBrains Mono';color:var(--faint)}
  .center{text-align:center}
`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="theme-color" content="#070709">${FONTS}<style>${STYLE}</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

const header =
  '<div class="brand">azula</div><div class="tag">p2p over iroh</div>';

const STORE_BTNS =
  // PLACEHOLDER store links — replace with the real App Store / Play URLs once published.
  '<a class="btn ghost" href="#ios-not-published">App Store (soon)</a>' +
  '<a class="btn ghost" href="#android-not-published">Google Play (soon)</a>';

export function landingPage(): string {
  return shell(
    "azula — peer to peer",
    `${header}
    <div class="hero">
      <h1>Your peer, your shell, your LLM —<br>direct and end-to-end encrypted.</h1>
      <p>azula links two devices straight to each other over <a href="https://iroh.computer">iroh</a>:
      UDP holepunched, QUIC encrypted, no server in the middle. Chat with a peer, drive a remote
      shell, or push messages into an LLM session — all over the same direct link.</p>
      <div class="pill">◉ direct · 12ms · e2e</div>
      <div class="btns">${STORE_BTNS}</div>
    </div>

    <div class="grid">
      <div class="card"><div class="glyph">z</div><h3>peer chat</h3><p>Paste a friend's code and you're talking over a direct, encrypted link. No account.</p></div>
      <div class="card"><div class="glyph">✦</div><h3>LLM via MCP</h3><p>Connect an LLM to your session through an MCP endpoint URL — it talks to your app, not a third party.</p></div>
      <div class="card"><div class="glyph">›_</div><h3>remote shell</h3><p>Hand a server's shell to your phone or desktop and drive it from anywhere.</p></div>
    </div>

    <div class="sec">
      <h2>Connecting an LLM to your session</h2>
      <p>Every session has a code. Wrap it in an MCP endpoint URL and add it to any MCP-capable LLM
      client — the LLM then reads and writes your session:</p>
      <pre><code>https://azula.app/mcp/&lt;your-session-code&gt;</code></pre>
      <p>Sharing a session with a person instead? Send them the invite link — it opens the app if
      installed, or shows them how to join:</p>
      <pre><code>https://azula.app/s/&lt;your-session-code&gt;</code></pre>
    </div>

    <footer>azula · peer-to-peer over iroh · <a href="https://azula.app">azula.app</a></footer>`,
  );
}

export function invitePage(token: string | null): string {
  if (!token) {
    return shell(
      "azula — invalid link",
      `${header}
      <div class="sec center">
        <h2>That invite link isn't valid</h2>
        <p>Ask for a fresh code, or open the azula app and paste it in.</p>
        <div class="btns center" style="justify-content:center">${STORE_BTNS}</div>
      </div>`,
    );
  }
  const scheme = appScheme(token);
  const fp = sessionFingerprint(token);
  return shell(
    "azula — join session",
    `${header}
    <div class="sec">
      <h2>Join an azula session</h2>
      <p>Opening the app… if nothing happens, it isn't installed yet.</p>
      <div class="codebox"><span class="k">session</span><span>${fp}…</span></div>
      <div class="btns">
        <a class="btn primary" href="${scheme}">Open in azula</a>
      </div>
      <p style="margin-top:18px;color:var(--dim);font-size:13.5px">Don't have azula?</p>
      <div class="btns">${STORE_BTNS}</div>
      <p style="margin-top:18px;color:var(--faint);font-size:12.5px">Or open azula and paste this code:</p>
      <div class="codebox"><span style="font:12px 'JetBrains Mono';color:var(--t1)">${escapeHtml(token)}</span></div>
    </div>
    <script>
      // Try the custom scheme; the universal/app link already covers installed apps.
      setTimeout(function(){ window.location.href = ${JSON.stringify(scheme)}; }, 200);
    </script>
    <footer>azula · <a href="https://azula.app">azula.app</a></footer>`,
  );
}

export function notFoundPage(): string {
  return shell(
    "azula — not found",
    `${header}<div class="sec center"><h2>404</h2><p>Nothing here. <a href="/">Go home</a >.</p></div>`,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
