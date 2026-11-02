import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, PageShell } from "@/components/portfolio/PortfolioChrome";
import { ProjectGallery } from "@/components/portfolio/Showcase";
import { pageMeta, pages } from "@/lib/meta";

export const Route = createFileRoute("/work")({
  head: () => pageMeta(pages.work),
  component: Work,
});

function Work() {
  return (
    <PageShell>
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <PageHeading eyebrow="01 / SELECTED PROJECTS" title="Built with" accent="intention." description="Privacy tooling for law enforcement, AI-powered hiring, real-time disaster response and a few things in between." />
        <p className="mb-6 text-xs text-muted-foreground">LIVE DEMOS & SOURCE ON GITHUB</p>
        <ProjectGallery filters />
      </div>
    </PageShell>
  );
}
