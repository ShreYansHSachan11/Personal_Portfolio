/**
 * Page titles, descriptions and share-preview tags for every route.
 *
 * The app renders in the browser, but link-preview scrapers (LinkedIn, WhatsApp, Slack, X)
 * do not run JavaScript. So the same descriptions feed two places: each route's head() at
 * runtime, and the build step in vite.config.ts that writes them into a static HTML file
 * per page. Keep this module free of "@/" imports: the Vite config loads it directly.
 */
import { posts, projects } from "../components/portfolio/content";

export const SITE_URL = "https://shreyanshsachan-portfolio.vercel.app";
export const SITE_NAME = "Shreyansh Sachan";
const OG_IMAGE = { url: `${SITE_URL}/og.png?v=2`, width: 1200, height: 630, alt: "Shreyansh Sachan, frontend developer: code meets curiosity." };

export interface PageMeta {
  /** Site-relative path, e.g. "/work/sherlock". Used for the canonical and og:url. */
  path: string;
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  type?: "website" | "article";
}

type MetaTag = { title: string } | { name: string; content: string } | { property: string; content: string };
type LinkTag = { rel: string; href: string };

/** Builds the title, description, canonical, Open Graph and Twitter tags for one page. */
export function pageMeta({ path, title, description, ogTitle = title, ogDescription = description, type = "website" }: PageMeta) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDescription },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE.url },
    { property: "og:image:width", content: String(OG_IMAGE.width) },
    { property: "og:image:height", content: String(OG_IMAGE.height) },
    { property: "og:image:alt", content: OG_IMAGE.alt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: ogTitle },
    { name: "twitter:description", content: ogDescription },
    { name: "twitter:image", content: OG_IMAGE.url },
  ];
  const links: LinkTag[] = [{ rel: "canonical", href: url }];
  return { meta, links };
}

/** Fixed pages. Detail pages are derived from the content below. */
export const pages = {
  home: {
    path: "/",
    title: "Shreyansh Sachan - Portfolio",
    description: "Portfolio of Shreyansh Sachan, a frontend developer building React products, AI-powered tools and real-time web apps.",
    ogDescription: "React, Node.js and AI projects — Sherlock, NextHire, Guardian and more. Come say hello.",
  },
  work: {
    path: "/work",
    title: "Projects — Shreyansh Sachan",
    description: "Projects by Shreyansh Sachan: Sherlock (PII anonymization), NextHire (AI job portal), Guardian (disaster response) and Resolv (AI incident management).",
    ogDescription: "AI tooling, full-stack apps and real-time platforms — with live demos and source code.",
  },
  achievements: {
    path: "/achievements",
    title: "Milestones — Shreyansh Sachan",
    description: "Experience, achievements, certifications and education of Shreyansh Sachan — frontend developer at Pinntag and Karnataka State Police Datathon winner.",
    ogDescription: "Experience, wins, and the path so far.",
  },
  blog: {
    path: "/blog",
    title: "The journal — Shreyansh Sachan",
    description: "Reading notes on classic essays about software: Brooks, Dijkstra, Spolsky, Graham, Gabriel and Victor, with the takeaways Shreyansh Sachan keeps coming back to.",
    ogDescription: "Classic essays on software, and what I took from them.",
  },
  contact: {
    path: "/contact",
    title: "Say hello — Shreyansh Sachan",
    description: "Get in touch with Shreyansh Sachan about frontend, full-stack and AI projects — by email, GitHub or LinkedIn.",
    ogDescription: "A good idea starts with a hello.",
  },
} as const satisfies Record<string, PageMeta>;

type ProjectLike = Pick<(typeof projects)[number], "slug" | "title" | "description">;
type PostLike = Pick<(typeof posts)[number], "slug" | "title" | "excerpt" | "source">;

export const projectPage = (p: ProjectLike): PageMeta => ({
  path: `/work/${p.slug}`,
  title: `${p.title} — Shreyansh Sachan`,
  description: p.description,
});

export const postPage = (p: PostLike): PageMeta => ({
  path: `/blog/${p.slug}`,
  title: p.source ? `${p.title} (${p.source.author}): reading notes — Shreyansh Sachan` : `${p.title} — Shreyansh Sachan`,
  description: p.excerpt,
  type: "article",
});

/** Every page that exists, for the build-time HTML and the sitemap. */
export const allPages = (): PageMeta[] => [
  ...Object.values(pages),
  ...projects.map(projectPage),
  ...posts.map(postPage),
];
