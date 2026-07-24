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

  it("declares applinks for the device-link paths (multi-device-identity task 6.6)", () => {
    const aasa = appleAppSiteAssociation() as any;
    const components = aasa.applinks.details[0].components;
    expect(components).toEqual(expect.arrayContaining([expect.objectContaining({ "/": "/l/*" })]));
  });
});

describe("assetLinks", () => {
  it("declares the android app package with a handle_all_urls delegation", () => {
    const links = assetLinks() as any[];
    expect(links[0].relation).toContain("delegate_permission/common.handle_all_urls");
    expect(links[0].target.namespace).toBe("android_app");
    expect(links[0].target.package_name).toBe("app.azula");
  });
});
