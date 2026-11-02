import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, PageShell } from "@/components/portfolio/PortfolioChrome";
import { JournalGrid } from "@/components/portfolio/Showcase";
import { pageMeta, pages } from "@/lib/meta";

export const Route = createFileRoute("/blog")({
  head: () => pageMeta(pages.blog),
  component: Blog,
});

function Blog() {
  return (
    <PageShell>
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <PageHeading eyebrow="03 / THE JOURNAL" title="Reading" accent="list." description="Classic essays on software that shaped how I build, with the takeaways I keep coming back to. My own writing will join them soon." />
        <p className="mb-6 text-xs text-muted-foreground">READING NOTES / EACH LINKS TO THE ORIGINAL</p>
        <JournalGrid filters />
      </div>
    </PageShell>
  );
}
