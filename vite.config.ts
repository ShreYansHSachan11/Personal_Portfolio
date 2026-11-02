import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { allPages, pageMeta, SITE_URL } from "./src/lib/meta";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Renders one page's head tags. `data-prerendered` lets the app drop them once it takes over. */
function headTags(page: Parameters<typeof pageMeta>[0]): string {
  const { meta, links } = pageMeta(page);
  const tags = meta.map((m) => {
    if ("title" in m) return `<title data-prerendered>${escapeHtml(m.title)}</title>`;
    const [key, value] = "name" in m ? ["name", m.name] : ["property", m.property];
    return `<meta data-prerendered ${key}="${escapeHtml(value)}" content="${escapeHtml(m.content)}" />`;
  });
  for (const l of links) tags.push(`<link data-prerendered rel="${escapeHtml(l.rel)}" href="${escapeHtml(l.href)}" />`);
  return tags.join("\n    ");
}

/**
 * Link-preview scrapers don't run JavaScript, so after the build this writes a copy of
 * index.html per page (dist/work/sherlock/index.html, ...) with that page's tags filled in,
 * plus a sitemap and robots.txt. Vercel serves these files before the SPA rewrite applies.
 */
function prerenderHeads(): Plugin {
  let outDir = "dist";
  return {
    name: "prerender-heads",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    async writeBundle() {
      const shell = await readFile(join(outDir, "index.html"), "utf8");
      if (!shell.includes("<!--app-head-->")) throw new Error("prerender-heads: <!--app-head--> missing from index.html");
      const pages = allPages();
      for (const page of pages) {
        const file = page.path === "/" ? join(outDir, "index.html") : join(outDir, page.path, "index.html");
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, shell.replace("<!--app-head-->", headTags(page)));
      }
      const urls = pages.map((p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`).join("\n");
      await writeFile(
        join(outDir, "sitemap.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      );
      await writeFile(join(outDir, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
    },
  };
}

export default defineConfig({
  // The router plugin must run before React so it can generate src/routeTree.gen.ts.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react(), tailwindcss(), prerenderHeads()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
