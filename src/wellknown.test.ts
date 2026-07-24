import { describe, expect, it } from "vitest";
import { appleAppSiteAssociation, assetLinks } from "./wellknown";

describe("appleAppSiteAssociation", () => {
  it("declares applinks for the session invite paths", () => {
    const aasa = appleAppSiteAssociation() as any;
    const components = aasa.applinks.details[0].components;
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "/": "/i/*" }),
        expect.objectContaining({ "/": "/s/*" }),
        expect.objectContaining({ "/": "/connect/*" }),
      ]),
    );
  });
});

describe("assetLinks", () => {
  it("declares the android app package with a handle_all_urls delegation", () => {
    const links = assetLinks() as any[];
    expect(links[0].relation).toContain("delegate_permission/common.handle_all_urls");
    expect(links[0].target.namespace).toBe("android_app");
    expect(links[0].target.package_name).toBe("app.azula");
  });

  it("declares a get_login_creds delegation so saved recovery phrases follow the domain", () => {
    const links = assetLinks() as any[];
    const creds = links.find((l) =>
      l.relation.includes("delegate_permission/common.get_login_creds"),
    );
    expect(creds).toBeDefined();
    expect(creds.target.namespace).toBe("android_app");
    expect(creds.target.package_name).toBe("app.azula");
    // Same signing cert as the URL-handling statement — a credential association
    // that didn't match the installed app's signature would silently never apply.
    expect(creds.target.sha256_cert_fingerprints).toEqual(
      links[0].target.sha256_cert_fingerprints,
    );
  });
});
