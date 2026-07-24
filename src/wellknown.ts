// Deeplink association files — see azula-docs/openspec/specs/deeplinks/design.md.

// iOS Apple App Site Association. appIDs are "<TeamID>.<bundleIdentifier>".
const IOS_APP_ID = "EB8N37743E.app.azula"; // Apple Team ID EB8N37743E + bundle id app.azula

// Android App Links. This is the Play **App Signing** cert SHA-256 (from Play
// Console → App signing), NOT the upload cert — Play re-signs the AAB with it.
const ANDROID_PACKAGE = "app.azula";
const ANDROID_SHA256 = "84:94:45:9D:9B:DE:72:6D:E1:B7:ED:50:C5:0D:F4:76:CE:45:F2:39:7E:3C:E3:10:E4:A5:90:93:E2:F6:78:98";

export function appleAppSiteAssociation(): unknown {
  return {
    applinks: {
      details: [
        {
          appIDs: [IOS_APP_ID],
          components: [
            { "/": "/i/*", comment: "invite links (v2)" },
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
  const target = {
    namespace: "android_app",
    package_name: ANDROID_PACKAGE,
    sha256_cert_fingerprints: [ANDROID_SHA256],
  };
  return [
    { relation: ["delegate_permission/common.handle_all_urls"], target },
    // Associates recovery-phrase credentials with azula.app rather than with a
    // single package. Credentials written by Credential Manager's
    // createCredential are scoped to the *calling* package, so without this a
    // phrase saved from app.azula.mock is invisible to app.azula — which is
    // exactly what device testing hit. Load-bearing, not labelling: it is what
    // makes the restore step's fill find a phrase the back-up step saved.
    { relation: ["delegate_permission/common.get_login_creds"], target },
  ];
}
