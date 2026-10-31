import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { findPost } from "@/components/portfolio/content";
import { PageShell } from "@/components/portfolio/PortfolioChrome";
import { JOURNAL_IMAGE, JOURNAL_IMAGE_ALT } from "@/components/portfolio/Showcase";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/meta";

const COPIED_RESET_MS = 2500;

// "blog_" un-nests this route from /blog so the archive page doesn't swallow it, while the URL stays /blog/$slug.
export const Route = createFileRoute("/blog_/$slug")({
  loader: ({ params }) => {
    const post = findPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageMeta({ title: `${loaderData.title} — Shreyansh Sachan`, description: loaderData.excerpt, type: "article" })
      : pageMeta({ title: "Story unavailable — Shreyansh Sachan", description: "This story is unavailable.", type: "article" }),
  component: Article,
});

type ShareState = "idle" | "copied" | "failed";

function useShareLink() {
  const [state, setState] = useState<ShareState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const share = async () => {
    window.clearTimeout(timer.current);
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(window.location.href);
      setState("copied");
      timer.current = window.setTimeout(() => setState("idle"), COPIED_RESET_MS);
    } catch (error) {
      console.warn("[share] Could not copy the article link", error);
      setState("failed");
    }
  };
  return { state, share };
}

function Article() {
  const post = Route.useLoaderData();
  const { state, share } = useShareLink();
  const copied = state === "copied";
  return (
    <PageShell>
      <article className="page-content mx-auto max-w-4xl px-6 pb-20">
        <Button asChild variant="link" className="mb-10 px-0 text-foreground">
          <Link to="/blog"><ArrowLeft /> The journal</Link>
        </Button>
        <div className="mb-5 flex gap-4 text-xs text-muted-foreground">
          <span>{post.category}</span><span>{post.date}</span><span>{post.minutes} min read</span>
        </div>
        <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">{post.title}</h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">{post.excerpt}</p>
        <div className="my-8 flex items-center justify-between border-y border-border py-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className="flex size-10 items-center justify-center rounded-full bg-accent font-display font-bold">s.</span>
            <div className="text-sm">Shreyansh <p className="text-xs text-muted-foreground">Sample journal entry</p></div>
          </div>
          <Button variant="outline" onClick={share} aria-label={copied ? "Article link copied" : "Copy article link"}>
            {copied ? <Check /> : <Copy />}<span>{copied ? "Copied" : "Share"}</span>
          </Button>
        </div>
        <p role="status" className="mb-5 text-sm text-muted-foreground empty:hidden">
          {state === "failed" ? "Copy the page address from your browser to share this story." : ""}
        </p>
        {post.category === "Design" && (
          <img src={JOURNAL_IMAGE} alt={JOURNAL_IMAGE_ALT} width={1536} height={1024} className="mb-12 aspect-[1.8] w-full rounded-lg object-cover" />
        )}
        <div className="article-body mx-auto max-w-2xl">
          {post.sections.map((s) => <section key={s.title}><h2>{s.title}</h2><p>{s.text}</p></section>)}
          <p className="border-t border-border pt-6 font-serif italic">Keep making things. Keep asking questions.</p>
        </div>
        <Button asChild variant="link" className="mt-10 px-0 text-foreground">
          <Link to="/blog"><ArrowLeft /> More from the journal</Link>
        </Button>
      </article>
    </PageShell>
  );
}
