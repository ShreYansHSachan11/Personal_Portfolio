import { describe, expect, it } from "vitest";
import { achievements, filterByCategory, findPost, findProject, posts, profile, projects } from "./content";

describe("Portfolio browsing", () => {
  it("shows Sherlock and NextHire for AI", () => {
    expect(filterByCategory(projects, "AI").map((p) => p.slug)).toEqual(["sherlock", "nexthire"]);
  });
  it("shows Guardian for Web3 and the FAQ Manager for Backend", () => {
    expect(filterByCategory(projects, "Web3").map((p) => p.slug)).toEqual(["guardian"]);
    expect(filterByCategory(projects, "Backend").map((p) => p.slug)).toEqual(["faq-manager"]);
  });
  it("shows all four projects when All is selected", () => {
    expect(filterByCategory(projects, "All").map((p) => p.slug)).toEqual(["sherlock", "nexthire", "guardian", "faq-manager"]);
  });
  it("shows the engineering article in its journal category", () => {
    expect(filterByCategory(posts, "Engineering").map((p) => p.slug)).toEqual(["learning-three-js"]);
  });
  it("resolves known slugs and rejects unknown ones", () => {
    expect(findProject("nexthire")?.title).toBe("NextHire");
    expect(findPost("building-small")?.category).toBe("Notes");
    expect(findProject("nope")).toBeUndefined();
    expect(findPost("nope")).toBeUndefined();
  });
});

describe("Portfolio links", () => {
  const external: string[] = [
    ...profile.links.map((l) => l.href),
    ...projects.flatMap((p) => (p.live ? [p.code, p.live] : [p.code])),
    ...achievements.flatMap((a) => (a.link ? [a.link.href] : [])),
  ];
  it("uses https for every external link", () => {
    for (const href of external) expect(new URL(href).protocol).toBe("https:");
  });
  it("links every project to its source code", () => {
    for (const p of projects) expect(p.code).toMatch(/^https:\/\/github\.com\/ShreYansHSachan11\//);
  });
});
