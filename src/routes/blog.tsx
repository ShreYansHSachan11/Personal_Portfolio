import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, PageShell } from "@/components/portfolio/PortfolioChrome";
import { JournalGrid } from "@/components/portfolio/Showcase";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/blog")({
  head: () =>
    pageMeta({
      title: "The journal — Shreyansh Sachan",
      description: "Notes on creative coding, thoughtful interfaces, and building small things. The journal of Shreyansh Sachan.",
      ogDescription: "Ideas, experiments, and notes from the studio.",
    }),
  component: Blog,
});

function Blog() {
  return (
    <PageShell>
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <PageHeading eyebrow="03 / THE JOURNAL" title="Thinking" accent="out loud." description="Ideas in progress. Things I've learned. A few things I'm still figuring out." />
        <p className="mb-6 text-xs text-muted-foreground">SAMPLE STORIES / A SPACE FOR YOUR WRITING</p>
        <JournalGrid filters />
      </div>
    </PageShell>
  );
}
