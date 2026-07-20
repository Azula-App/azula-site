import { appScheme, inviteAppScheme, sessionFingerprint, type InviteHeader } from "./links";

// No webfont <link> on purpose: the pages must not make third-party requests, so
// that /privacy can say the site loads nothing but itself. Both families are used
// when installed locally and fall back to system stacks otherwise (--sans/--mono).

const ICONS =
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg">' +
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">';

const STYLE = `
  :root{--primary:#ff2d9b;--primary-light:#ff6ec7;--primary-dark:#c4156e;--primary-edge:rgba(255,45,155,.4);
    --success:#52c98a;--warning:#ffd23f;--danger:#ff6b6b;--accent:#3fc8ff;
    --bg:#070709;--bg-wash:#120a18;--surface-subtle:#0c0c13;--surface-code:#1a1a23;
    --outline-subtle:#1d1d26;--outline-soft:#23232e;
    --content-strong:#f0f0f6;--content:#d6d6e0;--content-code:#cdd6e0;--content-dim:#8a8a9a;--content-faint:#6a6a7a;
    --sans:'Space Grotesk',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
  *{box-sizing:border-box}
  body{margin:0;background:radial-gradient(120% 80% at 50% -10%,var(--bg-wash),var(--bg));color:var(--content);
    font:15px/1.6 var(--sans);min-height:100vh}
  a{color:var(--primary-light);text-decoration:none}
  :focus-visible{outline:2px solid var(--primary-edge);outline-offset:2px;border-radius:10px}
  .wrap{max-width:880px;margin:0 auto;padding:48px 22px 64px}
  .brand{font:700 30px var(--mono);color:var(--primary);text-shadow:0 0 16px rgba(255,45,155,.4);letter-spacing:-1px}
  .brand .prompt{color:var(--success);margin-right:9px;text-shadow:0 0 12px rgba(82,201,138,.4)}
  .brand .cursor{display:inline-block;width:11px;height:24px;margin-left:7px;vertical-align:-3px;
    background:var(--primary);box-shadow:0 0 10px rgba(255,45,155,.55);animation:blink 1.05s steps(1) infinite}
  @keyframes blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.brand .cursor{animation:none;opacity:1}}
  .tag{font:12px var(--mono);color:var(--content-faint);margin-top:2px;letter-spacing:1px}
  .hero{margin-top:40px}
  .hero h1{font:700 40px/1.15 var(--sans);color:var(--content-strong);margin:0 0 14px}
  .hero p{font-size:17px;color:var(--content);max-width:620px}
  .pill{display:inline-flex;align-items:center;gap:7px;font:11px var(--mono);color:var(--success);
    border:1px solid var(--outline-soft);border-radius:999px;padding:5px 11px;margin-top:18px}
  .btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:26px}
  .btn{display:inline-block;padding:12px 18px;border-radius:11px;font-weight:600;font-size:14px}
  .btn.primary{background:linear-gradient(135deg,var(--primary),var(--primary-dark));color:#fff;box-shadow:0 0 18px rgba(255,45,155,.4)}
  .btn.ghost{border:1px solid var(--outline-soft);color:var(--content)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px;margin-top:46px}
  .card{background:var(--surface-subtle);border:1px solid var(--outline-subtle);border-radius:14px;padding:18px}
  .card h3{margin:0 0 6px;font-size:16px;color:var(--content-strong)}
  .card p{margin:0;font-size:13.5px;color:var(--content-dim)}
  .glyph{font:18px var(--mono);color:var(--primary-light);margin-bottom:8px}
  .sec{margin-top:48px}
  .sec h2{font-size:20px;color:var(--content-strong)}
  code{font:13px var(--mono);background:var(--surface-code);border:1px solid var(--outline-soft);border-radius:5px;padding:2px 6px;color:var(--primary-light)}
  pre{background:var(--bg);border:1px solid var(--outline-soft);border-radius:10px;padding:14px;overflow:auto}
  pre code{background:none;border:none;padding:0;color:var(--content-code);font-size:12.5px}
  .codebox{display:flex;align-items:center;gap:10px;background:var(--surface-subtle);border:1px solid var(--outline-soft);
    border-radius:11px;padding:13px 15px;margin-top:18px;word-break:break-all}
  .codebox .k{font:13px var(--mono);color:var(--primary-light)}
  footer{margin-top:56px;padding-top:20px;border-top:1px solid var(--outline-subtle);font:12px var(--mono);color:var(--content-faint)}
  footer a{color:var(--content-dim)}
  .center{text-align:center}
  /* privacy page */
  .prose{max-width:660px}
  .prose p,.prose li{color:var(--content)}
  .prose ul{padding-left:18px;margin:12px 0}
  .prose li{margin:7px 0}
  .prose li b,.prose p b{color:var(--content-strong);font-weight:600}
  .lede{font-size:17px;color:var(--content-strong)}
  .tbl{width:100%;max-width:660px;border-collapse:collapse;margin-top:16px;font-size:13.5px}
  .tbl th{font:11px var(--mono);text-transform:uppercase;letter-spacing:.6px;color:var(--content-faint)}
  .tbl th,.tbl td{text-align:left;padding:10px 12px 10px 0;border-bottom:1px solid var(--outline-subtle);vertical-align:top}
  .tbl td:first-child{color:var(--content-strong);white-space:nowrap;padding-right:18px}
  .tbl td{color:var(--content-dim)}
  .updated{margin-top:30px;font:12px var(--mono);color:var(--content-faint)}
`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><!-- theme-color is a literal: HTML attrs can't use CSS vars, must track --bg above -->
<meta name="theme-color" content="#070709">${ICONS}<style>${STYLE}</style></head>
<body><div class="wrap">${body}</div></body></html>`;
}

const brandHeader =
  '<div class="brand"><span class="prompt">&rsaquo;</span>azula<span class="cursor"></span></div>' +
  '<div class="tag">p2p over iroh</div>';

const STORE_BTNS =
  // PLACEHOLDER store links — replace with the real App Store / Play URLs once published.
  '<a class="btn ghost" href="#ios-not-published">App Store (soon)</a>' +
  '<a class="btn ghost" href="#android-not-published">Google Play (soon)</a>';

export function landingPage(): string {
  return shell(
    "azula — peer to peer",
    `${brandHeader}
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
      <p>Configure the azula MCP endpoint once in any MCP-capable LLM client — no per-session URLs.
      Then pair a device by giving azula its session link (in chat, or <code>azula pair</code>):</p>
      <pre><code>connect  https://azula.app/s/&lt;your-session-code&gt;</code></pre>
      <p>The same link works for a person — send it to a friend and it opens the app, or shows them
      how to join:</p>
      <pre><code>https://azula.app/s/&lt;your-session-code&gt;</code></pre>
    </div>

    <footer>azula · peer-to-peer over iroh · <a href="https://azula.app">azula.app</a> · <a href="/privacy">privacy</a></footer>`,
  );
}

export function invitePage(token: string | null): string {
  if (!token) {
    return shell(
      "azula — invalid link",
      `${brandHeader}
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
    `${brandHeader}
    <div class="sec">
      <h2>Join an azula session</h2>
      <p>Opening the app… if nothing happens, it isn't installed yet.</p>
      <div class="codebox"><span class="k">session</span><span>${fp}…</span></div>
      <div class="btns">
        <a class="btn primary" href="${scheme}">Open in azula</a>
      </div>
      <p style="margin-top:18px;color:var(--content-dim);font-size:13.5px">Don't have azula?</p>
      <div class="btns">${STORE_BTNS}</div>
      <p style="margin-top:18px;color:var(--content-faint);font-size:12.5px">Or open azula and paste this code:</p>
      <div class="codebox"><span style="font:12px var(--mono);color:var(--content)">${escapeHtml(token)}</span></div>
    </div>
    <script>
      // Try the custom scheme; the universal/app link already covers installed apps.
      setTimeout(function(){ window.location.href = ${JSON.stringify(scheme)}; }, 200);
    </script>
    <footer>azula · <a href="https://azula.app">azula.app</a></footer>`,
  );
}

export function invitePageV2(payload: string, header: InviteHeader): string {
  const scheme = inviteAppScheme(payload);
  const badges: string[] = [];
  if (header.signed) {
    badges.push('<span class="pill">✓ signed</span>');
  }
  if (header.singleUse) {
    badges.push('<span class="pill">⚡ single-use</span>');
  }
  const expiryFallback =
    header.expiresAt === 0 ? "no expiry" : header.expiresAt * 1000 < Date.now() ? "expired" : "calculating…";
  return shell(
    "azula — accept invite",
    `${brandHeader}
    <div class="sec">
      <h2>Accept an azula invite</h2>
      <p>Opening the app… if nothing happens, it isn't installed yet.</p>
      <div class="codebox"><span class="k">invite</span><span>${header.inviteId}</span></div>
      <div class="btns" style="margin-top:2px">
        ${badges.join("")}
        <span class="pill" id="expiry">${expiryFallback}</span>
      </div>
      <div class="btns">
        <a class="btn primary" href="${scheme}">Open in azula</a>
      </div>
      <p style="margin-top:18px;color:var(--content-dim);font-size:13.5px">Don't have azula?</p>
      <div class="btns">${STORE_BTNS}</div>
      <p style="margin-top:18px;color:var(--content-faint);font-size:12.5px">
        Signed invites are verified by the app when you connect — this page does not verify the
        signature (that's planned future work).
      </p>
      <p style="margin-top:12px;color:var(--content-faint);font-size:12.5px">Or open azula and paste this invite:</p>
      <div class="codebox"><span style="font:12px var(--mono);color:var(--content)">${escapeHtml(payload)}</span></div>
    </div>
    <script>
      // Try the custom scheme; the universal/app link already covers installed apps.
      setTimeout(function(){ window.location.href = ${JSON.stringify(scheme)}; }, 200);
      (function(){
        var el = document.getElementById('expiry');
        var expiresAt = ${JSON.stringify(header.expiresAt)};
        if (!el || expiresAt === 0) return;
        function fmt(){
          var now = Math.floor(Date.now() / 1000);
          var diff = expiresAt - now;
          if (diff <= 0) { el.textContent = 'expired'; return; }
          var d = Math.floor(diff / 86400), h = Math.floor(diff % 86400 / 3600),
              m = Math.floor(diff % 3600 / 60), s = Math.floor(diff % 60);
          var parts = [];
          if (d) parts.push(d + 'd');
          if (h || d) parts.push(h + 'h');
          if (m || h || d) parts.push(m + 'm');
          parts.push(s + 's');
          el.textContent = 'expires in ' + parts.join(' ');
        }
        fmt();
        setInterval(fmt, 1000);
      })();
    </script>
    <footer>azula · <a href="https://azula.app">azula.app</a></footer>`,
  );
}

// Everything on this page is a factual claim about the shipped code — keep it that
// way. If the app ever gains telemetry, a backend, cloud sync, remote push, or a
// third-party SDK, this page is wrong until it's updated. `PRIVACY_UPDATED` is the
// date the wording last changed; bump it whenever the substance does.
const PRIVACY_UPDATED = "13 July 2026";
const PRIVACY_CONTACT = "privacy@azula.app";

export function privacyPage(): string {
  return shell(
    "azula — privacy",
    `${brandHeader}
    <div class="hero">
      <h1>Privacy</h1>
      <p class="lede">azula has no accounts and no servers that hold your data. Your identity, your
      messages and your peer list live on your device, and messages go straight to the other device,
      end-to-end encrypted.</p>
    </div>

    <div class="sec prose">
      <p>That is the whole policy. The rest of this page is the detail — including the few places
      where something other than your device is unavoidably involved. We would rather name those than
      claim a tidy zero.</p>
    </div>

    <div class="sec prose">
      <h2>What we collect</h2>
      <p>Nothing. Concretely, azula has:</p>
      <ul>
        <li><b>no account</b> — no sign-up, no email address, no phone number, no username;</li>
        <li><b>no analytics, telemetry, crash reporting or attribution SDK</b> — not in the app, not
        in the CLI, not on this website;</li>
        <li><b>no cookies</b>, no tracking pixels, no ads, no data brokers;</li>
        <li><b>no database</b>. We run no server that stores your messages, contacts or keys, because
        we run no server that stores anything at all.</li>
      </ul>
      <p>We cannot hand over your messages, close your account, or tell anyone who you talked to. We
      never had any of it.</p>
    </div>

    <div class="sec prose">
      <h2>Your identity</h2>
      <p>Your identity is a keypair generated on your device the first time you open azula. The public
      half is your node id — the code you hand to a peer. The private half never leaves the device.
      The optional 24-word recovery phrase is that same private key encoded so you can write it down;
      it is never transmitted and we never see it.</p>
      <p>Where the key is kept depends on the platform: the <b>Android Keystore</b> on Android and the
      <b>Keychain</b> on iOS and macOS, both encrypted at rest. On Linux and Windows desktop — and for
      the CLI's own long-lived identities — it is currently a plain file under <code>~/.azula/</code>.
      That one is not encrypted at rest, so treat it like an SSH private key.</p>
    </div>

    <div class="sec prose">
      <h2>Your data stays on your device</h2>
      <p>Messages, profiles, peers, invitations, settings and received media are written to local
      storage on the device that received them. Nothing syncs to a cloud, because there is no cloud.
      Uninstalling the app deletes it.</p>
      <p>One caveat we do not control: <b>your operating system's own backup</b> — Android's automatic
      backup, or an iCloud/local backup on iOS — can sweep up app data along with everything else on
      your phone. azula never sends that data anywhere, but if you want no copy to exist off the
      device at all, exclude azula in your device's backup settings.</p>
    </div>

    <div class="sec prose">
      <h2>How messages travel</h2>
      <p>azula connects two devices directly over <a href="https://iroh.computer">iroh</a>: a
      hole-punched QUIC link, encrypted end to end. The keys are on the two devices, so nothing in
      between can read what you send — not us, not a relay, not an ISP.</p>
      <p>Two parts of that connection do involve infrastructure run by <b>n0</b>, the team behind iroh:</p>
      <ul>
        <li><b>Discovery.</b> So that a peer can find you, your node id and current address are
        published by default to n0's DNS/pkarr discovery service. This happens whether or not you ever
        connect to anyone.</li>
        <li><b>Relays.</b> When a direct hole-punch fails — a strict NAT, a hostile network — the
        encrypted packets are forwarded through n0's relay servers instead. They relay ciphertext and
        cannot read your messages, but they do see connection metadata: which node ids are talking,
        when, how much, and from which IP address.</li>
      </ul>
      <p>So: your content, never. Metadata, sometimes, to n0. iroh supports custom relays and turning
      discovery off; azula does not expose those as settings yet.</p>
    </div>

    <div class="sec prose">
      <h2>This website</h2>
      <p>azula.app is a Cloudflare Worker that renders static pages. No cookies, no analytics, no
      database, no fonts or scripts from anyone else — a page here loads nothing but itself.</p>
      <p>The part worth knowing: an invite link carries your invite code <i>in the URL</i>
      (<code>azula.app/i/&lt;code&gt;</code>). When the app is installed the link opens it directly and
      this site is never involved. But if such a link is opened in a browser, that URL — code included
      — passes through Cloudflare, our host, and lands in its standard request logs. An invite code is
      a bearer credential: whoever holds it can dial your device. Treat invite links like passwords,
      prefer single-use invites with an expiry, and don't post them in public.</p>
    </div>

    <div class="sec prose">
      <h2>If you connect an LLM</h2>
      <p>azula can bridge an MCP-capable LLM into a session. If you set that up, everything you route
      through the bridge — the messages it sends and reads on your behalf — goes to whichever LLM
      provider you configured, and their privacy policy governs it from there. That is your endpoint
      and your choice; the bridge runs on your own machine and sends nothing anywhere else.</p>
    </div>

    <div class="sec prose">
      <h2>Everyone who is involved</h2>
      <table class="tbl">
        <tr><th>Who</th><th>Why</th><th>What they can see</th></tr>
        <tr><td>n0 (iroh)</td><td>Peer discovery, and relaying when a direct link fails</td>
          <td>Connection metadata — node ids, IP addresses, timing, volume. Never message content.</td></tr>
        <tr><td>Cloudflare</td><td>Hosts azula.app</td>
          <td>Standard web request logs for pages served here, including the URL path — which for an
          invite link contains the invite code.</td></tr>
        <tr><td>Your LLM provider</td><td>Only if you connect one yourself</td>
          <td>Whatever you route through the MCP bridge.</td></tr>
      </table>
      <p style="margin-top:16px">That is the complete list. There is no analytics vendor, ad network
      or data broker to add to it.</p>
    </div>

    <div class="sec prose">
      <h2>Changes, and how to reach us</h2>
      <p>If any of this changes, this page changes with it. We have no account to email you about and
      no mailing list to put you on, so this page is the notice — the date below tells you when it
      last moved.</p>
      <p>Questions: <a href="mailto:${PRIVACY_CONTACT}">${PRIVACY_CONTACT}</a>.</p>
      <p class="updated">Last updated ${PRIVACY_UPDATED}</p>
    </div>

    <footer>azula · peer-to-peer over iroh · <a href="/">azula.app</a></footer>`,
  );
}

export function notFoundPage(): string {
  return shell(
    "azula — not found",
    `${brandHeader}<div class="sec center"><h2>404</h2><p>Nothing here. <a href="/">Go home</a>.</p></div>`,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
