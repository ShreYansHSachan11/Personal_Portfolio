import { createRootRoute, HeadContent, Link, Outlet } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageShell } from "@/components/portfolio/PortfolioChrome";
import { Button } from "@/components/ui/button";

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <>
      <HeadContent />
      <Outlet />
    </>
  );
}

function NotFound() {
  return (
    <PageShell band={false}>
      {/* Not-found renders outside a matched route's head(), so set its tags directly (React 19 hoists them). */}
      <title>Page not found — Shreyansh Sachan</title>
      <meta name="description" content="This page doesn't exist. Head back to the studio." />
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <p className="mb-5 text-xs font-bold uppercase">404 / LOST IN THE STUDIO</p>
        <h1 className="font-display text-5xl font-extrabold leading-tight md:text-7xl">
          Nothing <span className="font-serif font-normal italic text-secondary">here.</span>
        </h1>
        <p className="mt-5 max-w-lg text-muted-foreground">That page wandered off. Let's get you somewhere useful.</p>
        <Button asChild variant="link" className="mt-8 px-0 text-foreground">
          <Link to="/"><ArrowLeft /> Back home</Link>
        </Button>
      </div>
    </PageShell>
  );
}
