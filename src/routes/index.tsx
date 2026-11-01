import { ClientOnly, createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUpRight, Sparkles } from "lucide-react";
import { lazy, Suspense } from "react";
import { CursorBlob, FlowLine, Magnetic } from "@/components/portfolio/Interactive";
import { ContactBand, PortfolioNav } from "@/components/portfolio/PortfolioChrome";
import { RicochetPlayground } from "@/components/portfolio/RicochetPlayground";
import { SceneBoundary } from "@/components/portfolio/SceneBoundary";
import { AchievementList, ExperienceList, JournalGrid, ProjectGallery } from "@/components/portfolio/Showcase";
import { skills } from "@/components/portfolio/content";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

const HeroCards = lazy(() => import("@/components/portfolio/hero/HeroCards"));

export const Route = createFileRoute("/")({
  head: () =>
    pageMeta({
      title: "Shreyansh Sachan — Frontend & full-stack developer",
      description: "Portfolio of Shreyansh Sachan, a frontend developer building React products, AI-powered tools and real-time web apps.",
      ogDescription: "React, Node.js and AI projects — Sherlock, NextHire, Guardian and more. Come say hello.",
    }),
  component: Index,
});


function SectionTitle({ number, title, accent, to, label, eyebrow = "FROM THE STUDIO" }: {
  number: string;
  title: string;
  accent: string;
  to: "/work" | "/achievements" | "/blog";
  eyebrow?: string;
  label: string;
}) {
  return (
    <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="mb-4 text-xs font-semibold text-muted-foreground">{number} / {eyebrow}</p>
        <h2 className="font-display text-4xl font-extrabold sm:text-5xl md:text-6xl">
          {title} <span className="font-serif font-normal italic text-secondary">{accent}</span>
        </h2>
      </div>
      <Button variant="link" asChild className="px-0 text-foreground">
        <Link to={to}>{label}<ArrowUpRight /></Link>
      </Button>
    </div>
  );
}

const sceneFallback = <div className="sculpture-loading" />;

function Index() {
  return (
    <main className="grain portfolio-flow relative overflow-x-hidden">
      <PortfolioNav />
      <ClientOnly><CursorBlob /></ClientOnly>
      <div className="flow-trail pointer-events-none absolute inset-0">
        <ClientOnly><FlowLine /></ClientOnly>
      </div>

      <section className="portfolio-hero relative mx-auto max-w-7xl px-6">
        <div className="hero-scene">
          <ClientOnly fallback={sceneFallback}>
            <SceneBoundary>
              <Suspense fallback={sceneFallback}><HeroCards /></Suspense>
            </SceneBoundary>
          </ClientOnly>
        </div>
        <div className="hero-copy pointer-events-none relative z-10">
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase">
            <span aria-hidden className="h-2 w-2 rounded-full bg-primary" /> FRONTEND DEVELOPER @ PINNTAG
          </p>
          <h1 className="font-display font-extrabold leading-[.98]">
            Shreyansh<span className="text-primary">.</span><br />
            <span className="font-serif font-normal italic text-secondary">Code meets</span><br />
            curiosity.
          </h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-muted-foreground">
            I build fast, thoughtful React products — right now, real-time promotions at Pinntag — with a soft spot for AI, RAG pipelines and the occasional “what if?”
          </p>
          <div className="pointer-events-auto mt-8 flex items-center gap-6">
            <Magnetic>
              <Button asChild className="h-14 rounded-full border-2 border-foreground px-6 font-display font-bold shadow-pop">
                <Link to="/work">Explore my work<ArrowUpRight /></Link>
              </Button>
            </Magnetic>
            <a href="#play" className="font-serif text-lg italic underline decoration-primary underline-offset-4">a little detour ↘</a>
          </div>
        </div>
        <div className="hero-footer absolute inset-x-6 bottom-8 flex items-center justify-between border-t border-border pt-5 text-xs text-muted-foreground">
          <span>B.Tech CSE (Data Science) · Datathon winner</span>
          <a href="#selected-work" aria-label="Scroll to selected work" className="flex items-center gap-2">
            SCROLL TO EXPLORE<ArrowDown className="size-4" />
          </a>
        </div>
      </section>

      <section aria-label="Skills" className="skills-ribbon relative z-10 overflow-hidden border-y-2 border-foreground bg-accent py-5">
        <ul className="sr-only">{skills.map((s) => <li key={s}>{s}</li>)}</ul>
        <div aria-hidden className="flex w-max animate-marquee items-center gap-10 whitespace-nowrap font-display text-xl font-bold">
          {[...skills, ...skills].map((s, i) => (
            <span key={i} className="flex items-center gap-10">{s}<Sparkles className="size-5" /></span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <p className="text-xs font-semibold text-muted-foreground">A LITTLE ABOUT MY APPROACH ↗</p>
          <p className="font-display text-3xl font-semibold leading-snug md:text-4xl">
            Good software should work <span className="font-serif font-normal italic text-primary">beautifully.</span> Great software
            should make you <span className="font-serif font-normal italic text-secondary">feel something.</span>
          </p>
        </div>
      </section>

      <section id="selected-work" className="relative z-10 mx-auto max-w-6xl px-6 pb-28 md:pb-36">
        <SectionTitle number="01" eyebrow="THINGS I'VE BUILT" title="Selected" accent="work." to="/work" label="All projects" />
        <ProjectGallery />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <SectionTitle number="02" eyebrow="WHERE I'VE WORKED" title="Experience," accent="so far." to="/achievements" label="Full journey" />
        <ExperienceList />
      </section>

      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <SectionTitle number="03" eyebrow="MILESTONES" title="Little wins," accent="big steps." to="/achievements" label="All milestones" />
          <AchievementList />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-24 md:py-32">
        <SectionTitle number="04" eyebrow="WHAT I'M READING" title="Notes from" accent="the classics." to="/blog" label="The journal" />
        <JournalGrid limit={3} />
      </section>

      <section id="play" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-4 text-xs text-muted-foreground">05 / NO BRIEF. JUST PLAY.</p>
            <h2 className="font-display text-4xl font-extrabold md:text-5xl">
              A little <span className="font-serif font-normal italic text-primary">ricochet.</span>
            </h2>
          </div>
          <span className="font-serif text-xl italic text-muted-foreground">a good idea takes a few bounces. ✳</span>
        </div>
        <RicochetPlayground />
      </section>

      <ContactBand />
    </main>
  );
}
