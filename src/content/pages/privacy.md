---
title: Privacy
description: azula has no accounts and no servers that hold your data. Here is the detail, including the few places something other than your device is involved.
---

<!--
  Everything on this page is a factual claim about the shipped code — keep it that
  way. If the app ever gains telemetry, a backend, cloud sync, remote push, or a
  third-party SDK, this page is wrong until it's updated. The "Last updated" date
  at the bottom is when the wording last changed; bump it whenever the substance
  does. src/lib/privacy.test.ts pins each disclosure below.
-->

azula has no accounts and no servers that hold your data. Your identity, your
messages and your peer list live on your device, and messages go straight to the
other device, end-to-end encrypted.

That is the whole policy. The rest of this page is the detail — including the few
places where something other than your device is unavoidably involved. We would
rather name those than claim a tidy zero.

## What we collect

Nothing. Concretely, azula has:

- **no account** — no sign-up, no email address, no phone number, no username;
- **no analytics, telemetry, crash reporting or attribution SDK** — not in the
  app, not in the CLI, not on this website;
- **no cookies**, no tracking pixels, no ads, no data brokers;
- **no database**. We run no server that stores your messages, contacts or keys,
  because we run no server that stores anything at all.

We cannot hand over your messages, close your account, or tell anyone who you
talked to. We never had any of it.

## Your identity

Your identity is a keypair generated on your device the first time you open
azula. The public half is your node id — the code you hand to a peer. The private
half never leaves the device. The optional 24-word recovery phrase is that same
private key encoded so you can write it down; it is never transmitted and we
never see it.

Where the key is kept depends on the platform: the **Android Keystore** on
Android and the **Keychain** on iOS and macOS, both encrypted at rest. On Linux
and Windows desktop — and for the CLI's own long-lived identities — it is
currently a plain file under `~/.azula/`. That one is not encrypted at rest, so
treat it like an SSH private key.

## Your data stays on your device

Messages, profiles, peers, invitations, settings and received media are written
to local storage on the device that received them. Nothing syncs to a cloud,
because there is no cloud. Uninstalling the app deletes it.

One caveat we do not control: **your operating system's own backup** — Android's
automatic backup, or an iCloud/local backup on iOS — can sweep up app data along
with everything else on your phone. azula never sends that data anywhere, but if
you want no copy to exist off the device at all, exclude azula in your device's
backup settings.

## How messages travel

azula connects two devices directly over [iroh](https://iroh.computer): a
hole-punched QUIC link, encrypted end to end. The keys are on the two devices, so
nothing in between can read what you send — not us, not a relay, not an ISP.

Two parts of that connection do involve infrastructure run by **n0**, the team
behind iroh:

- **Discovery.** So that a peer can find you, your node id and current address
  are published by default to n0's DNS/pkarr discovery service. This happens
  whether or not you ever connect to anyone.
- **Relays.** When a direct hole-punch fails — a strict NAT, a hostile network —
  the encrypted packets are forwarded through n0's relay servers instead. They
  relay ciphertext and cannot read your messages, but they do see connection
  metadata: which node ids are talking, when, how much, and from which IP
  address.

So: your content, never. Metadata, sometimes, to n0. iroh supports custom relays
and turning discovery off; azula does not expose those as settings yet.

If you run your own [relay](/docs/cli#azula-relay--the-always-on-sibling), that
is a device of your own identity, not a service of ours — it holds queued
messages for your other devices until they come back online.

## This website

azula.app is a Cloudflare Worker that renders static pages. No cookies, no
analytics, no database, no fonts or scripts from anyone else — a page here loads
nothing but itself. That is not just a promise: every page carries a
Content-Security-Policy that permits resources from this origin only, so a
browser would refuse a third-party request even if one were ever added.

The part worth knowing: an invite link carries your invite code *in the URL*
(`azula.app/i/<code>`). When the app is installed the link opens it directly and
this site is never involved. But if such a link is opened in a browser, that
URL — code included — passes through Cloudflare, our host, and lands in its
standard request logs. An invite code is a bearer credential: whoever holds it
can dial your device. Treat invite links like passwords, prefer single-use
invites with an expiry, and don't post them in public.

## If you connect an LLM

azula can bridge an MCP-capable LLM into a session. If you set that up,
everything you route through the bridge — the messages it sends and reads on your
behalf — goes to whichever LLM provider you configured, and their privacy policy
governs it from there. That is your endpoint and your choice; the bridge runs on
your own machine and sends nothing anywhere else.

## Everyone who is involved

| Who | Why | What they can see |
| --- | --- | --- |
| n0 (iroh) | Peer discovery, and relaying when a direct link fails | Connection metadata — node ids, IP addresses, timing, volume. Never message content. |
| Cloudflare | Hosts azula.app | Standard web request logs for pages served here, including the URL path — which for an invite link contains the invite code. |
| Your LLM provider | Only if you connect one yourself | Whatever you route through the MCP bridge. |

That is the complete list. There is no analytics vendor, ad network or data
broker to add to it.

## Changes, and how to reach us

If any of this changes, this page changes with it. We have no account to email
you about and no mailing list to put you on, so this page is the notice — the
date below tells you when it last moved.

Questions: [privacy@azula.app](mailto:privacy@azula.app).

Last updated 26 July 2026
