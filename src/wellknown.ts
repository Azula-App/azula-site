// Deeplink association files — see azula-docs/openspec/specs/deeplinks/design.md.

// iOS Apple App Site Association. appIDs are "<TeamID>.<bundleIdentifier>".
const IOS_APP_ID = "EB8N37743E.app.azula"; // Apple Team ID EB8N37743E + bundle id app.azula

// Android App Links. This is the Play **App Signing** cert SHA-256 (from Play
// Console → App signing), NOT the upload cert — Play re-signs the AAB with it.
const ANDROID_PACKAGE = "app.azula";
const ANDROID_SHA256 = "9A:CD:CD:2B:0A:0B:0B:17:A7:69:B1:2D:08:4E:75:A8:86:D2:2D:1B:8B:7E:C1:47:BF:90:6C:78:1F:CD:72:F8";

export function appleAppSiteAssociation(): unknown {
  return {
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            { "/": "/i/*", comment: "invite links (v2)" },
            { "/": "/l/*", comment: "device-link codes (multi-device-identity task 6.6)" },
            { "/": "/s/*", comment: "legacy session invite links" },
            { "/": "/connect/*", comment: "legacy session invite links (alias)" },
          ],
        },
      ],
    },
    // Present so the file is valid even before webcredentials/appclips are used.
    webcredentials: { apps: [IOS_APP_ID] },
  };
}

export function assetLinks(): unknown {
  return [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: ANDROID_PACKAGE,
        sha256_cert_fingerprints: [ANDROID_SHA256],
      },
    },
  ];
}
