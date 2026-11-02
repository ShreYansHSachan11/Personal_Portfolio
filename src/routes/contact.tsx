import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Mail } from "lucide-react";
import { profile } from "@/components/portfolio/content";
import { ExternalLink } from "@/components/portfolio/ExternalLink";
import { Magnetic } from "@/components/portfolio/Interactive";
import { PageHeading, PageShell } from "@/components/portfolio/PortfolioChrome";
import { Button } from "@/components/ui/button";
import { pageMeta, pages } from "@/lib/meta";

export const Route = createFileRoute("/contact")({
  head: () => pageMeta(pages.contact),
  component: Contact,
});

function Contact() {
  const [user, domain] = profile.email.split("@");
  return (
    <PageShell band={false}>
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <PageHeading
          eyebrow="LET'S MAKE SOMETHING MATTER"
          title="Good things start"
          accent="with hello."
          description="Have an interesting problem, a role you think I'd be great for, or simply something worth talking about? My inbox is open."
        />
        <div className="mt-14 border-y border-border py-10">
          <p className="mb-6 font-serif text-3xl italic">The quickest way to reach me.</p>
          <Magnetic>
            <Button asChild className="h-auto min-h-16 max-w-full whitespace-normal rounded-full border-2 border-foreground px-6 py-3 text-left font-display text-base font-bold shadow-pop sm:px-8 sm:text-lg">
              {/* The address may wrap after "@" on narrow phones rather than being cut off. */}
              <a href={`mailto:${profile.email}`}><Mail /> <span className="min-w-0">{user}@<wbr />{domain}</span></a>
            </Button>
          </Magnetic>
        </div>
        <ul className="grid gap-x-10 sm:grid-cols-2">
          {profile.links.map((l) => (
            <li key={l.label} className="border-b border-border">
              <ExternalLink href={l.href} className="group flex items-center justify-between py-6">
                <span>
                  <span className="block text-xs text-muted-foreground">{l.label}</span>
                  <span className="mt-1 block font-display text-xl font-bold group-hover:text-primary">{l.handle}</span>
                </span>
                <ArrowUpRight className="size-5 transition-transform group-hover:rotate-45" />
              </ExternalLink>
            </li>
          ))}
        </ul>
        <Button asChild variant="link" className="mt-8 px-0 text-foreground">
          <Link to="/work">Explore the work<ArrowUpRight /></Link>
        </Button>
      </div>
    </PageShell>
  );
}
