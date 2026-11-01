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
  it("groups the journal by category", () => {
    expect(filterByCategory(posts, "Engineering").map((p) => p.slug)).toEqual(["no-silver-bullet", "go-to-considered-harmful", "worse-is-better"]);
    expect(filterByCategory(posts, "Design").map((p) => p.slug)).toEqual(["magic-ink"]);
    expect(filterByCategory(posts, "All")).toHaveLength(posts.length);
  });
  it("resolves known slugs and rejects unknown ones", () => {
    expect(findProject("nexthire")?.title).toBe("NextHire");
    expect(findPost("makers-schedule")?.source?.author).toBe("Paul Graham");
    expect(findProject("nope")).toBeUndefined();
    expect(findPost("nope")).toBeUndefined();
  });
});

describe("Journal", () => {
  it("has unique slugs, and every post is either credited reading notes or a dated post", () => {
    expect(new Set(posts.map((p) => p.slug)).size).toBe(posts.length);
    for (const p of posts) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.sections.length).toBeGreaterThan(0);
      expect(Boolean(p.source) || Boolean(p.date)).toBe(true);
    }
  });
});

describe("Portfolio links", () => {
  const external: string[] = [
    ...profile.links.map((l) => l.href),
    ...projects.flatMap((p) => (p.live ? [p.code, p.live] : [p.code])),
    ...achievements.flatMap((a) => (a.link ? [a.link.href] : [])),
    ...posts.flatMap((p) => (p.source ? [p.source.url] : [])),
  ];
  it("uses https for every external link", () => {
    for (const href of external) expect(new URL(href).protocol).toBe("https:");
  });
  it("links every project to its source code", () => {
    for (const p of projects) expect(p.code).toMatch(/^https:\/\/github\.com\/ShreYansHSachan11\//);
  });
});
