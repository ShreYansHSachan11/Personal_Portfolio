import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ArrowUpRight, Github } from "lucide-react";
import { findProject, projects } from "@/components/portfolio/content";
import { ExternalLink } from "@/components/portfolio/ExternalLink";
import { PageShell } from "@/components/portfolio/PortfolioChrome";
import { ProjectPreview } from "@/components/portfolio/ProjectPreview";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

// "work_" un-nests this route from /work so the archive page doesn't swallow it, while the URL stays /work/$slug.
export const Route = createFileRoute("/work_/$slug")({
  loader: ({ params }) => {
    const project = findProject(params.slug);
    if (!project) throw notFound();
    return project;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageMeta({ title: `${loaderData.title} — Shreyansh Sachan`, description: loaderData.description })
      : pageMeta({ title: "Project unavailable — Shreyansh Sachan", description: "This project is unavailable." }),
  component: Project,
});

function Project() {
  const p = Route.useLoaderData();
  const next = projects[(projects.findIndex((item) => item.slug === p.slug) + 1) % projects.length];
  return (
    <PageShell>
      <article className="page-content mx-auto max-w-6xl px-6 pb-20">
        <Button variant="link" asChild className="mb-10 px-0 text-foreground">
          <Link to="/work"><ArrowLeft /> All projects</Link>
        </Button>
        <p className="mb-5 text-xs text-muted-foreground">{p.number} / {p.category} · {p.live ? "LIVE + SOURCE" : "SOURCE ON GITHUB"}</p>
        <h1 className="font-display text-6xl font-extrabold md:text-8xl">{p.title}<span className="text-primary">.</span></h1>
        <p className="mt-5 font-serif text-3xl italic md:text-4xl">{p.subtitle}</p>
        <p className="mt-6 max-w-xl text-muted-foreground">{p.description}</p>
        <div className="mb-10 mt-8 flex flex-wrap gap-3">
          {p.live && (
            <Button asChild className="h-12 rounded-full border-2 border-foreground px-6 font-display font-bold shadow-pop">
              <ExternalLink href={p.live}>View live <ArrowUpRight /></ExternalLink>
            </Button>
          )}
          <Button asChild variant="outline" className="h-12 rounded-full border-foreground px-6">
            <ExternalLink href={p.code}><Github /> Source code</ExternalLink>
          </Button>
        </div>
        <ProjectPreview art={p.art} large />
        <div className="my-14 grid gap-8 border-y border-border py-7 sm:grid-cols-3">
          <div><p className="mb-2 text-xs text-muted-foreground">CATEGORY</p><p className="text-sm">{p.category}</p></div>
          <div><p className="mb-2 text-xs text-muted-foreground">TOOLKIT</p><p className="text-sm">{p.stack.join(" · ")}</p></div>
          <div><p className="mb-2 text-xs text-muted-foreground">STATUS</p><p className="text-sm">{p.live ? "Live demo · Open source" : "Open source"}</p></div>
        </div>
        <div className="article-body mx-auto max-w-2xl">
          <section><h2>What it does</h2><p>{p.overview}</p></section>
          <section><h2>How it's built</h2><p>{p.build}</p></section>
          <section>
            <h2>Impact</h2>
            {p.impact.map((line) => <p key={line}>{line}</p>)}
          </section>
        </div>
        {next && (
          <Link to="/work/$slug" params={{ slug: next.slug }} className="mt-16 flex items-center justify-between border-t border-border pt-10">
            <div>
              <p className="mb-3 text-xs text-muted-foreground">NEXT PROJECT</p>
              <span className="font-display text-4xl font-bold">{next.title}</span>
            </div>
            <ArrowRight className="size-8" />
          </Link>
        )}
      </article>
    </PageShell>
  );
}
