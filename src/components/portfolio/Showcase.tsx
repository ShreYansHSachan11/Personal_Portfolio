import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, Award, BadgeCheck, Code2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import journalImage from "@/assets/journal-sculpture.svg";
import { achievements, education, experience, filterByCategory, POST_CATEGORIES, posts, PROJECT_CATEGORIES, projects, skillGroups, type Post } from "./content";
import { ExternalLink } from "./ExternalLink";
import { TiltCard } from "./Interactive";
import { ProjectPreview } from "./ProjectPreview";

export const JOURNAL_IMAGE = journalImage;
export const JOURNAL_IMAGE_ALT = "Glossy blue ribbon sculpture with coral sphere and lime prism";

const ACHIEVEMENT_ICONS = { award: Award, code: Code2, badge: BadgeCheck } as const;


function CategoryFilter<T extends string>({ label, options, value, onChange, className }: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className: string;
}) {
  return (
    <div role="group" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((c) => (
        <Button
          key={c}
          onClick={() => onChange(c)}
          variant={value === c ? "default" : "outline"}
          aria-pressed={value === c}
          className="rounded-full"
        >
          {c}
        </Button>
      ))}
    </div>
  );
}

export function ProjectGallery({ filters = false, limit }: { filters?: boolean; limit?: number }) {
  const [category, setCategory] = useState<(typeof PROJECT_CATEGORIES)[number]>("All");
  const selected = filterByCategory(projects, category).slice(0, limit);
  return (
    <>
      {filters && (
        <CategoryFilter label="Project categories" options={PROJECT_CATEGORIES} value={category} onChange={setCategory} className="mb-8" />
      )}
      <div className="project-grid">
        {selected.map((p, i) => (
          <TiltCard key={p.slug} className={i % 2 ? "md:translate-y-12" : ""}>
            <Link to="/work/$slug" params={{ slug: p.slug }} className="project-card group block">
              <ProjectPreview art={p.art} />
              <div className="flex items-start justify-between gap-3 pt-6">
                <div>
                  <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{p.number} / {p.category}</span><span aria-hidden>—</span><span>{p.live ? "Live + code" : "Code"}</span>
                  </div>
                  <h3 className="font-display text-3xl font-extrabold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
                </div>
                <span className="project-arrow" aria-hidden><ArrowUpRight className="size-5" /></span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.stack.map((s) => <span key={s} className="border-b border-border pb-1 text-xs text-muted-foreground">{s}</span>)}
              </div>
            </Link>
          </TiltCard>
        ))}
      </div>
    </>
  );
}

export function AchievementList() {
  return (
    <div>
      {achievements.map((a, i) => {
        const Icon = ACHIEVEMENT_ICONS[a.icon];
        return (
          <div key={a.type} className="achievement-row group">
            <span className="text-xs text-muted-foreground">{a.tag} / {String(i + 1).padStart(2, "0")}</span>
            <div className={`achievement-icon achievement-${i}`} aria-hidden><Icon className="size-7" /></div>
            <div>
              <span className="text-xs font-semibold text-secondary">{a.type}</span>
              <h3 className="mt-1 font-display text-2xl font-bold md:text-3xl">{a.title}</h3>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">{a.detail}</p>
            </div>
            {a.link ? (
              <ExternalLink href={a.link.href} className="hidden font-serif text-lg italic text-muted-foreground hover:text-foreground md:block">
                {a.link.label} ↗
              </ExternalLink>
            ) : <span aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

export function ExperienceList() {
  return (
    <div>
      {experience.map((job) => (
        <div key={job.company} className="experience-row">
          <div>
            <p className="text-xs text-muted-foreground">{job.period}</p>
            <p className="mt-2 text-xs font-semibold text-secondary">{job.kind}</p>
          </div>
          <div>
            <h3 className="font-display text-2xl font-bold md:text-3xl">
              {job.company} <span className="font-serif font-normal italic text-muted-foreground">— {job.role}</span>
            </h3>
            <ul className="mt-4 max-w-2xl space-y-2 text-sm text-muted-foreground">
              {job.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export function EducationList() {
  return (
    <div>
      {education.map((e) => (
        <div key={e.school} className="education-row">
          <span className="text-xs text-muted-foreground">{e.year}</span>
          <div>
            <h3 className="font-display text-xl font-bold">{e.school}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
          </div>
          <span className="font-serif text-lg italic text-muted-foreground">{e.place}</span>
        </div>
      ))}
    </div>
  );
}

export function SkillGroups() {
  return (
    <dl className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
      {skillGroups.map((g) => (
        <div key={g.title} className="border-t border-border pt-4">
          <dt className="text-xs font-semibold text-secondary">{g.title}</dt>
          <dd className="mt-2 text-sm text-muted-foreground">{g.items.join(" · ")}</dd>
        </div>
      ))}
    </dl>
  );
}

function JournalCover({ post }: { post: Post }) {
  if (post.category === "Design") {
    return <img src={JOURNAL_IMAGE} alt={JOURNAL_IMAGE_ALT} loading="lazy" width={1536} height={1024} />;
  }
  if (post.category === "Engineering") {
    return (
      <div className="code-art" aria-hidden>
        <span className="text-accent">const</span> curiosity =<br />
        <span className="pl-8 font-serif text-6xl italic">infinite;</span>
        <div className="mt-5 text-sm text-secondary-foreground/60">{"// make something unexpected"}</div>
      </div>
    );
  }
  return (
    <div className="note-art" aria-hidden>
      <span className="font-serif text-6xl italic">Make<br />small<br />things.</span>
      <span className="note-star">✳</span>
    </div>
  );
}

export function JournalGrid({ filters = false }: { filters?: boolean }) {
  const [category, setCategory] = useState<(typeof POST_CATEGORIES)[number]>("All");
  const selected = filterByCategory(posts, category);
  return (
    <>
      {filters && (
        <CategoryFilter label="Journal categories" options={POST_CATEGORIES} value={category} onChange={setCategory} className="mb-10" />
      )}
      <div className="journal-grid">
        {selected.map((p) => (
          <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="journal-card group">
            <div className={`journal-cover cover-${p.theme}`}>
              <JournalCover post={p} />
              <span className="journal-cover-arrow" aria-hidden><ArrowUpRight className="size-5" /></span>
            </div>
            <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.category} / {p.date}</span>
              <span>{p.minutes} min read</span>
            </div>
            <h3 className="mt-3 font-display text-2xl font-bold leading-snug group-hover:text-secondary">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.excerpt}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold">
              Read story <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
