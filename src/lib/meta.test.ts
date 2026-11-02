import { describe, expect, it } from "vitest";
import { posts, projects } from "../components/portfolio/content";
import { allPages, pageMeta, pages, SITE_URL } from "./meta";

describe("page metadata", () => {
  it("covers every fixed page, project and post exactly once", () => {
    const paths = allPages().map((p) => p.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths).toHaveLength(Object.keys(pages).length + projects.length + posts.length);
    for (const p of projects) expect(paths).toContain(`/work/${p.slug}`);
    for (const p of posts) expect(paths).toContain(`/blog/${p.slug}`);
  });

  it("gives every page a title, a description and absolute share URLs", () => {
    for (const page of allPages()) {
      const { meta, links } = pageMeta(page);
      const content = (key: string) =>
        meta.find((m) => ("property" in m && m.property === key) || ("name" in m && m.name === key));
      expect(meta.some((m) => "title" in m && m.title.length > 0)).toBe(true);
      expect(content("description")).toMatchObject({ content: expect.stringMatching(/\S/) });
      expect(content("og:url")).toEqual({ property: "og:url", content: `${SITE_URL}${page.path}` });
      expect(content("og:image")).toMatchObject({ content: expect.stringMatching(/^https:\/\//) });
      expect(links).toEqual([{ rel: "canonical", href: `${SITE_URL}${page.path}` }]);
    }
  });

  it("credits the original author in reading-note titles", () => {
    const note = allPages().find((p) => p.path === "/blog/no-silver-bullet");
    expect(note?.title).toContain("Brooks");
    expect(note?.type).toBe("article");
  });
});
