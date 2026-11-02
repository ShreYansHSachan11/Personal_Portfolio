import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { profile } from "./content";
import { ExternalLink } from "./ExternalLink";

const NAV_ITEMS = [
  { to: "/work", label: "Work" },
  { to: "/achievements", label: "Milestones" },
  { to: "/blog", label: "Journal" },
] as const;

export function PortfolioNav() {
  return (
    <header className="portfolio-nav">
      <Link to="/" className="-m-2 p-2 font-display text-xl font-extrabold" aria-label={`${profile.name} — home`}>
        s<span className="text-primary">.</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-1 sm:gap-4">
        {NAV_ITEMS.map((item) => (
          <Button asChild variant="ghost" className="nav-link px-2 text-xs sm:text-sm" key={item.to}>
            <Link to={item.to} activeProps={{ className: "text-primary" }}>{item.label}</Link>
          </Button>
        ))}
        <Button asChild variant="outline" className="rounded-full border-foreground px-3 text-xs sm:px-5 sm:text-sm">
          <Link to="/contact">Let's talk <ArrowUpRight /></Link>
        </Button>
      </nav>
    </header>
  );
}

export function ContactBand() {
  return (
    <section className="contact-band relative mt-12 overflow-hidden px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="mb-4 font-serif text-2xl italic">a good idea starts with a hello.</p>
        <div className="flex flex-wrap items-end justify-between gap-8">
          <h2 className="font-display text-4xl font-extrabold leading-none max-[380px]:text-[32px] sm:text-5xl md:text-7xl">
            Let's make<br />something <span className="font-serif font-normal italic text-secondary">matter.</span>
          </h2>
          <Button asChild className="h-16 rounded-full border-2 border-foreground bg-foreground px-8 text-lg text-background">
            <Link to="/contact">Say hello <Mail /></Link>
          </Button>
        </div>
        <div className="mt-16 flex flex-wrap justify-between gap-4 border-t border-foreground/20 pt-6 text-xs">
          <span>© 2026 {profile.name} · Made with a little curiosity.</span>
          <nav aria-label="Profiles" className="flex flex-wrap gap-x-5 gap-y-2">
            {profile.links.map((l) => (
              <ExternalLink key={l.label} href={l.href} className="hover:text-primary">{l.label} ↗</ExternalLink>
            ))}
          </nav>
          <span>Code. Craft. A little chaos.</span>
        </div>
      </div>
    </section>
  );
}

export function PageHeading({ eyebrow, title, accent, description }: { eyebrow: string; title: string; accent: string; description: string }) {
  return (
    <div className="mb-12">
      <p className="mb-5 text-xs font-bold uppercase">{eyebrow}</p>
      <h1 className="font-display text-5xl font-extrabold leading-tight md:text-7xl">
        {title} <span className="font-serif font-normal italic text-secondary">{accent}</span>
      </h1>
      <p className="mt-5 max-w-lg text-muted-foreground">{description}</p>
    </div>
  );
}

/** Shared page shell for every route except the home page. */
export function PageShell({ children, band = true }: { children: ReactNode; band?: boolean }) {
  return (
    <main className="grain min-h-screen overflow-x-hidden">
      <PortfolioNav />
      {children}
      {band && <ContactBand />}
    </main>
  );
}
