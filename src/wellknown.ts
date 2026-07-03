// Deeplink association files. The PLACEHOLDER values below must be filled with
// the real signing identities once the apps are signed — see docs/deeplinks.md.

// iOS Apple App Site Association. appIDs are "<TeamID>.<bundleIdentifier>".
const IOS_APP_ID = "TEAMID.app.azula"; // PLACEHOLDER — replace TEAMID with your Apple Developer Team ID

// Android App Links. The fingerprint is the SHA-256 of the *release* signing
// cert (or the Play App Signing cert from the Play Console).
const ANDROID_PACKAGE = "app.azula";
const ANDROID_SHA256 = "REPLACE_WITH_RELEASE_SHA256_FINGERPRINT"; // PLACEHOLDER

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
