import { X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { ChessStats, Interest, InterestItem } from "../content";
import { covers } from "./covers";
import { PlayableBoard } from "./ChessBoard";
import { chessComUrls, parseChessCom } from "./interest-logic";

/** Live chess.com numbers, starting from the build-time snapshot and keeping it if the fetch fails. */
function useChessComStats(username: string, snapshot: ChessStats) {
  const [stats, setStats] = useState(snapshot);
  const [live, setLive] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const urls = chessComUrls(username);
    const get = (url: string) =>
      fetch(url, { signal: controller.signal }).then((r) => {
        if (!r.ok) throw new Error(`chess.com ${r.status}`);
        return r.json() as Promise<unknown>;
      });
    Promise.all([get(urls.profileApi), get(urls.statsApi)])
      .then(([profile, raw]) => {
        const next = parseChessCom(profile, raw);
        // Keep snapshot values for anything the API left out.
        setStats({
          rapid: next.rapid ?? snapshot.rapid,
          puzzles: next.puzzles ?? snapshot.puzzles,
          games: next.games || snapshot.games,
          league: next.league ?? snapshot.league,
          avatar: next.avatar ?? snapshot.avatar,
        });
        setLive(true);
      })
      .catch(() => {
        // Offline, blocked or aborted: the snapshot stays on screen.
      });
    return () => controller.abort();
  }, [username, snapshot]);
  return { stats, live };
}

function ChessProfile({ username, snapshot }: { username: string; snapshot: ChessStats }) {
  const { stats, live } = useChessComStats(username, snapshot);
  const urls = chessComUrls(username);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const ratings = [
    ["Rapid", stats.rapid],
    ["Puzzles, best", stats.puzzles],
  ] as const;
  return (
    <div className="ip-profile">
      <a className="ip-profile-head" href={urls.profile} target="_blank" rel="noreferrer">
        {stats.avatar && !avatarFailed
          ? <img src={stats.avatar} alt="" width={46} height={46} referrerPolicy="no-referrer" onError={() => setAvatarFailed(true)} />
          : <span className="ip-avatar-fallback" aria-hidden>♞</span>}
        <span>
          <strong>{username}</strong>
          <em>on chess.com{stats.league ? ` · ${stats.league} league` : ""}</em>
        </span>
      </a>
      <dl className="ip-ratings">
        {ratings.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <p className="ip-games">
        <strong>{stats.games.toLocaleString("en-IN")}</strong> games played
        <span className={`ip-live ${live ? "is-live" : ""}`}>{live ? "live" : "snapshot"}</span>
      </p>
      <a className="ip-challenge" href={urls.challenge} target="_blank" rel="noreferrer">
        Challenge me <span aria-hidden>♟</span>
      </a>
    </div>
  );
}

function ChessView({ interest }: { interest: Extract<Interest, { kind: "chess" }> }) {
  const [mode, setMode] = useState<"play" | "puzzle">("play");
  const modes = (
    <div className="ip-modes" role="tablist" aria-label="Board mode">
      <button type="button" role="tab" aria-selected={mode === "play"} onClick={() => setMode("play")}>Free play</button>
      <button type="button" role="tab" aria-selected={mode === "puzzle"} onClick={() => setMode("puzzle")}>Mate in one</button>
    </div>
  );
  return (
    <div className="ip-chess">
      <div>
        {mode === "play"
          ? <PlayableBoard key="play" toolbar={modes} />
          : <PlayableBoard key="puzzle" toolbar={modes} fen={interest.fen} puzzle={{ hint: interest.solution.from, solvedCaption: interest.solvedCaption }} />}
      </div>
      <ChessProfile username={interest.chessCom.username} snapshot={interest.chessCom.snapshot} />
    </div>
  );
}

/** Real cover art when we have it; a drawn title card if the image is missing or fails to load. */
function Cover({ title, className }: { title: string; className?: string }) {
  const src = covers[title];
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className={`ip-cover ip-cover-fallback ${className ?? ""}`}><span>{title}</span></span>;
  }
  return (
    <img
      className={`ip-cover ${className ?? ""}`}
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
      onError={() => setFailed(true)}
    />
  );
}

function MusicView({ items }: { items: readonly InterestItem[] }) {
  const [playing, setPlaying] = useState(0);
  const now = items[playing];
  return (
    <div className="ip-music">
      {now && (
        <div key={now.title} className="ip-deck" aria-hidden>
          <div className="ip-vinyl">
            <Cover title={now.title} className="ip-vinyl-label" />
          </div>
          <Cover title={now.title} className="ip-sleeve" />
        </div>
      )}
      <ol className="ip-tracks">
        {items.map((item, i) => (
          <li key={item.title}>
            <button type="button" aria-pressed={playing === i} onClick={() => setPlaying(i)}>
              <Cover title={item.title} className="ip-thumb" />
              <span className="ip-track"><strong>{item.title}</strong><em>{item.meta}</em></span>
              {playing === i && <span className="ip-eq" aria-hidden><i /><i /><i /><i /></span>}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

function BooksView({ items }: { items: readonly InterestItem[] }) {
  const [picked, setPicked] = useState(0);
  const book = items[picked];
  return (
    <div className="ip-books">
      <div className="ip-shelf">
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            aria-pressed={picked === i}
            aria-label={`${item.title} by ${item.meta}`}
            className="ip-book"
            style={{ zIndex: picked === i ? items.length : items.length - Math.abs(picked - i) }}
            onClick={() => setPicked(i)}
          >
            <span className="ip-book-3d">
              <Cover title={item.title} className="ip-book-front" />
            </span>
            {picked === i && <span className="ip-ribbon" aria-hidden />}
          </button>
        ))}
      </div>
      {book && (
        <p className="ip-book-note" aria-live="polite">
          <strong>{book.title}</strong> <em>by {book.meta}</em>
        </p>
      )}
    </div>
  );
}

function MoviesView({ items }: { items: readonly InterestItem[] }) {
  return (
    <div className="ip-reel">
      <ul className="ip-strip">
        {items.map((item) => (
          <li key={item.title} className="ip-frame">
            <span className="ip-poster"><Cover title={item.title} /></span>
            <strong>{item.title}</strong>
            <span className="ip-year">{item.meta}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Body({ interest }: { interest: Interest }) {
  switch (interest.kind) {
    case "chess": return <ChessView interest={interest} />;
    case "music": return <MusicView items={interest.items} />;
    case "books": return <BooksView items={interest.items} />;
    case "movies": return <MoviesView items={interest.items} />;
  }
}

/** Modal panel for one "what I'm into" card. Native <dialog> gives focus trapping, Escape and focus return. */
export function InterestPanel({ interest, onClose }: { interest: Interest | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Keep the last interest rendered while the dialog animates closed.
  const [shown, setShown] = useState<Interest | null>(interest);
  if (interest && interest !== shown) setShown(interest);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (interest && !d.open) d.showModal();
    if (!interest && d.open) d.close();
  }, [interest]);

  const backdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) e.currentTarget.close();
  };

  return (
    <dialog
      ref={dialog}
      className={`interest-panel tone-${shown?.tone ?? "card"}`}
      aria-labelledby="interest-title"
      onClose={onClose}
      onClick={backdropClick}
    >
      {shown && (
        <div className="ip-inner">
          <header className="ip-head">
            <div>
              <p className="ip-eyebrow">WHAT I'M INTO</p>
              <h2 id="interest-title" className="font-display">{shown.label}</h2>
              <p className="ip-tagline">{shown.tagline}</p>
            </div>
            <button type="button" className="ip-close" aria-label="Close" onClick={() => dialog.current?.close()}>
              <X />
            </button>
          </header>
          <div key={shown.kind} className="ip-body">
            <Body interest={shown} />
          </div>
          {shown.sample && <p className="ip-sample">Sample picks for now. The real list is coming soon.</p>}
        </div>
      )}
    </dialog>
  );
}
