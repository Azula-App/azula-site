---
title: Links and the URL scheme
description: What an azula.app/i/… link carries, how it opens the app, and why you should treat one like a password.
order: 5
---

Sharing access to an azula node means handing someone a **link**. This site
serves the web fallback for those links; when the app is installed, the OS
opens it directly and this site is never involved.

## Invite links — `azula.app/i/<payload>`

The current, canonical share format. The payload is a binary header — invite
id, validity window, single-use flag, optional Ed25519 signature — wrapping the
issuer's iroh endpoint ticket, encoded as `"azi" + base32` (RFC 4648, no
padding, lowercase).

```sh
azula invite --expires 24h --sign --single-use
```

- Tapping the link on a device with the app installed opens the app straight
  into the connect flow.
- Without the app, [azula.app/i/…](/) shows the invite id, its expiry
  countdown, signed and single-use badges, and the raw payload to paste.
- `azula://i?c=<payload>` is the custom-scheme fallback the web page tries.
- A bare `azi…` string pastes directly into the app's connect box.

Revocation is issuer-side: the id lives in the payload, and
`azula invite revoke <id-prefix>` drops it from your issued-invite store. No
server is involved, which is why there's nothing to take down.

## Session links — `azula.app/s/<token>` *(legacy)*

Before invite payloads, azula shared the raw iroh endpoint ticket wrapped in a
`/s/<token>` link. `/connect/<token>` is an alias for the same thing. These
keep working — the app and CLI still parse them — but new share links should
use `/i/`.

## Device-link codes — `azula.app/l/<payload>`

Not an invite: this carries a *different device's* own node key and connect
ticket, so a phone camera can open it instead of staring at inert text. It's
what `azula link` prints when you enroll a second device on one identity. Only
continue on the device that already holds your identity — you confirm four
verification words on both ends, and the new device never receives your
recovery phrase.

## Treat a link like a password

An invite is a **bearer credential**: whoever holds it can dial your device.
And because the code rides in the URL path, opening one in a browser puts it in
this site's host's request logs.

So: prefer signed, single-use invites with an expiry; send them over a channel
you trust; don't paste them anywhere public.

## Well-known files

Universal Links and App Links need this site to serve two association files as
unredirected JSON, which it does:

- `/.well-known/apple-app-site-association` — iOS, covering `/i/*`, `/s/*` and
  `/connect/*`
- `/.well-known/assetlinks.json` — Android, host-scoped
