import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeading, PageShell } from "@/components/portfolio/PortfolioChrome";
import { AchievementList, EducationList, ExperienceList, SkillGroups } from "@/components/portfolio/Showcase";
import { pageMeta } from "@/lib/meta";

export const Route = createFileRoute("/achievements")({
  head: () =>
    pageMeta({
      title: "Milestones — Shreyansh Sachan",
      description: "Experience, achievements, certifications and education of Shreyansh Sachan — frontend developer at Pinntag and Karnataka State Police Datathon winner.",
      ogDescription: "Experience, wins, and the path so far.",
    }),
  component: Achievements,
});

function SubHeading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <div className="mb-6 mt-20">
      <p className="mb-3 text-xs font-semibold text-muted-foreground">{eyebrow}</p>
      <h2 className="font-display text-3xl font-extrabold md:text-4xl">{children}</h2>
    </div>
  );
}

function Achievements() {
  return (
    <PageShell>
      <div className="page-content mx-auto max-w-6xl px-6 pb-20">
        <PageHeading
          eyebrow="02 / THE JOURNEY"
          title="Little wins,"
          accent="big steps."
          description="Where I've worked, what I've won, and what I've learned along the way."
        />
        <SubHeading eyebrow="EXPERIENCE">Where I've <span className="font-serif font-normal italic text-secondary">worked.</span></SubHeading>
        <ExperienceList />
        <SubHeading eyebrow="ACHIEVEMENTS & CERTIFICATIONS">Things I'm <span className="font-serif font-normal italic text-secondary">proud of.</span></SubHeading>
        <AchievementList />
        <SubHeading eyebrow="TOOLKIT">What I <span className="font-serif font-normal italic text-secondary">work with.</span></SubHeading>
        <SkillGroups />
        <SubHeading eyebrow="EDUCATION">Where I <span className="font-serif font-normal italic text-secondary">learned.</span></SubHeading>
        <EducationList />
        <p className="mt-16 font-serif text-3xl italic text-secondary">The best part? There's more to come.</p>
      </div>
    </PageShell>
  );
}
