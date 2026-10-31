interface PageMeta {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  type?: "website" | "article";
}

/** Builds the page-specific title, description, Open Graph and Twitter tags every route needs. */
export function pageMeta({ title, description, ogTitle = title, ogDescription = description, type = "website" }: PageMeta) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: ogTitle },
      { property: "og:description", content: ogDescription },
      { property: "og:type", content: type },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
