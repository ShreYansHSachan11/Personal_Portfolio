import { Pause, Play, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { ChessStats, Interest, InterestItem } from "../content";
import { covers } from "./covers";
import { PlayableBoard } from "./ChessBoard";
import { chessComUrls, parseChessCom, spotifySearchUrl } from "./interest-logic";
import { previews } from "./previews";

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
      <a className="ip-challenge" href={urls.challenge} target="_blank" rel="noreferrer" aria-label="Challenge me on chess.com">
        Challenge<span className="ip-challenge-me"> me</span> <span aria-hidden>♟</span>
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

/** Song list with 30-second iTunes previews; the record spins only while a clip plays. */
function MusicView({ items, open }: { items: readonly InterestItem[]; open: boolean }) {
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [failed, setFailed] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const loaded = useRef<string | null>(null);
  const now = items[current];
  const clip = now ? previews[now.title] : undefined;

  // The panel stays mounted while it animates closed, so stop the music as soon as it closes.
  useEffect(() => {
    if (!open) audio.current?.pause();
  }, [open]);
  useEffect(() => {
    const el = audio.current;
    return () => el?.pause();
  }, []);

  /** Plays track i, or toggles pause if it's already the one playing. */
  const toggle = (i: number) => {
    const el = audio.current;
    const item = items[i];
    const p = item ? previews[item.title] : undefined;
    setCurrent(i);
    setFailed(false);
    if (!el || !item || !p) {
      setFailed(Boolean(item));
      return;
    }
    if (loaded.current === item.title && !el.paused) {
      el.pause();
      return;
    }
    if (loaded.current !== item.title) {
      el.src = p.audio;
      loaded.current = item.title;
      setProgress(0);
    }
    el.play().catch((e: unknown) => {
      // Switching tracks quickly aborts the previous play() call; that isn't a failure.
      if (!(e instanceof DOMException && e.name === "AbortError")) setFailed(true);
    });
    if ("mediaSession" in navigator) {
      const art = covers[item.title];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: item.title,
        artist: item.meta,
        artwork: art ? [{ src: art, sizes: "600x600", type: "image/jpeg" }] : [],
      });
    }
  };

  const ended = () => {
    setPlaying(false);
    setProgress(0);
    // Carry on down the list, stopping after the last song.
    if (current + 1 < items.length) toggle(current + 1);
  };

  return (
    <div className="ip-music">
      <div className="ip-player">
        {now && (
          <div key={now.title} className={`ip-deck ${playing ? "is-playing" : ""}`} aria-hidden>
            <div className="ip-vinyl">
              <Cover title={now.title} className="ip-vinyl-label" />
            </div>
            <Cover title={now.title} className="ip-sleeve" />
          </div>
        )}
        {now && (
          <div className="ip-controls">
            <button
              type="button"
              className="ip-playpause"
              onClick={() => toggle(current)}
              aria-label={`${playing ? "Pause" : "Play"} ${now.title}`}
              disabled={!clip}
            >
              {playing ? <Pause /> : <Play />}
            </button>
            <span className="ip-progress" aria-hidden><i style={{ transform: `scaleX(${progress})` }} /></span>
          </div>
        )}
        {now && (
          <p className="ip-listen">
            {failed ? "Preview unavailable. " : "30s preview. "}Full song on{" "}
            {clip && <><a href={clip.link} target="_blank" rel="noreferrer">Apple Music</a>{" · "}</>}
            <a href={spotifySearchUrl(now.title, now.meta)} target="_blank" rel="noreferrer">Spotify</a>
          </p>
        )}
      </div>
      <ol className="ip-tracks">
        {items.map((item, i) => {
          const active = current === i;
          return (
            <li key={item.title}>
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${active && playing ? "Pause" : "Play"} ${item.title} by ${item.meta}`}
                onClick={() => toggle(i)}
              >
                <Cover title={item.title} className="ip-thumb" />
                <span className="ip-track"><strong>{item.title}</strong><em>{item.meta}</em></span>
                {active && <span className={`ip-eq ${playing ? "" : "is-paused"}`} aria-hidden><i /><i /><i /><i /></span>}
              </button>
            </li>
          );
        })}
      </ol>
      <audio
        ref={audio}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={ended}
        onError={() => {
          setPlaying(false);
          if (loaded.current) setFailed(true);
        }}
        onTimeUpdate={(e) => {
          const { currentTime, duration } = e.currentTarget;
          setProgress(duration > 0 ? currentTime / duration : 0);
        }}
      />
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

function Body({ interest, open }: { interest: Interest; open: boolean }) {
  switch (interest.kind) {
    case "chess": return <ChessView interest={interest} />;
    case "music": return <MusicView items={interest.items} open={open} />;
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
            <Body interest={shown} open={interest !== null} />
          </div>
          {shown.sample && <p className="ip-sample">Sample picks for now. The real list is coming soon.</p>}
        </div>
      )}
    </dialog>
  );
}
