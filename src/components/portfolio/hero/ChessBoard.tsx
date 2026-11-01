import { Chess, type Color, type Move, type PieceSymbol, type Square } from "chess.js";
import { FlipVertical2, RotateCcw, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";

const GLYPH: Record<PieceSymbol, string> = { k: "♚", q: "♛", r: "♜", b: "♝", n: "♞", p: "♟" };
const NAME: Record<PieceSymbol, string> = { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight", p: "pawn" };
const SIDE: Record<Color, string> = { w: "White", b: "Black" };
const FILES = "abcdefgh";
const PROMOTIONS = ["q", "r", "b", "n"] as const;
type Promotion = (typeof PROMOTIONS)[number];

/** Square names in display order (top-left first) for the given orientation. */
function squaresFor(flipped: boolean): Square[] {
  const out: Square[] = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const rank = flipped ? r + 1 : 8 - r;
      const file = FILES[flipped ? 7 - f : f] ?? "a";
      out.push(`${file}${rank}` as Square);
    }
  }
  return out;
}

/** a1 is a dark square. */
const isDark = (sq: Square) => (FILES.indexOf(sq[0] ?? "a") + Number(sq[1])) % 2 === 1;

function statusOf(game: Chess): { text: string; over: boolean } {
  const turn = SIDE[game.turn()];
  if (game.isCheckmate()) return { text: `Checkmate. ${SIDE[game.turn() === "w" ? "b" : "w"]} wins.`, over: true };
  if (game.isStalemate()) return { text: "Stalemate. It's a draw.", over: true };
  if (game.isThreefoldRepetition()) return { text: "Draw by repetition.", over: true };
  if (game.isInsufficientMaterial()) return { text: "Draw: not enough pieces to mate.", over: true };
  if (game.isDraw()) return { text: "Draw by the 50-move rule.", over: true };
  if (game.inCheck()) return { text: `${turn} is in check.`, over: false };
  return { text: `${turn} to move.`, over: false };
}

interface BoardProps {
  fen?: string;
  /** Puzzle mode: only the side to move plays, one move, and it must be checkmate. */
  puzzle?: { hint: Square; solvedCaption: string };
  /** Rendered at the start of the control row above the board (the mode tabs). */
  toolbar?: ReactNode;
}

type PlayedMove = { from: Square; to: Square; promotion?: Promotion };

/** Rebuilds a game from its start position and moves, so repetition and 50-move draws are tracked. */
function replay(fen: string | undefined, moves: readonly PlayedMove[]): Chess {
  const game = new Chess(fen);
  for (const m of moves) game.move(m);
  return game;
}

export function PlayableBoard({ fen, puzzle, toolbar }: BoardProps) {
  // React state holds only the moves; the chess.js game is derived from them on each change.
  const [moves, setMoves] = useState<PlayedMove[]>([]);
  const g = useMemo(() => replay(fen, moves), [fen, moves]);
  const [selected, setSelected] = useState<Square | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState<{ from: Square; to: Square } | null>(null);
  const [puzzleState, setPuzzleState] = useState<"idle" | "wrong" | "solved">("idle");
  const [hint, setHint] = useState(false);
  const [shake, setShake] = useState(0);
  const undoTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  const history = g.history({ verbose: true });
  const last: Move | undefined = history[history.length - 1];
  const status = statusOf(g);
  const locked = status.over || puzzleState === "solved" || puzzleState === "wrong" || pending !== null;
  const targets = selected ? g.moves({ square: selected, verbose: true }) : [];
  const checkSquare = g.inCheck()
    ? g.board().flat().find((p) => p?.type === "k" && p.color === g.turn())?.square
    : undefined;

  const play = (from: Square, to: Square, promotion?: Promotion) => {
    const move: PlayedMove = { from, to, promotion };
    const next = replay(fen, moves);
    try {
      next.move(move);
    } catch {
      return; // Illegal: chess.js throws; ignore the attempt.
    }
    setMoves([...moves, move]);
    setSelected(null);
    setPending(null);
    if (!puzzle) return;
    if (next.isCheckmate()) {
      setPuzzleState("solved");
    } else {
      setPuzzleState("wrong");
      setShake((n) => n + 1);
      undoTimer.current = window.setTimeout(() => {
        setMoves((prev) => prev.slice(0, -1));
        setPuzzleState("idle");
      }, 900);
    }
  };

  const attempt = (from: Square, to: Square) => {
    const legal = g.moves({ square: from, verbose: true }).filter((m) => m.to === to);
    if (!legal.length) return false;
    if (legal.some((m) => m.promotion)) setPending({ from, to });
    else play(from, to);
    return true;
  };

  const press = (sq: Square) => {
    if (locked) return;
    if (selected && selected !== sq && attempt(selected, sq)) return;
    const piece = g.get(sq);
    setSelected(piece && piece.color === g.turn() && sq !== selected ? sq : null);
  };

  const dragStart = (e: DragEvent<HTMLButtonElement>, sq: Square) => {
    const piece = g.get(sq);
    if (locked || !piece || piece.color !== g.turn()) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", sq);
    e.dataTransfer.effectAllowed = "move";
    setSelected(sq);
  };
  const drop = (e: DragEvent<HTMLButtonElement>, sq: Square) => {
    e.preventDefault();
    const from = e.dataTransfer.getData("text/plain") as Square;
    if (from && from !== sq) attempt(from, sq);
  };

  const reset = () => {
    window.clearTimeout(undoTimer.current);
    setMoves([]);
    setSelected(null);
    setPending(null);
    setPuzzleState("idle");
    setHint(false);
  };
  const undo = () => {
    if (puzzle || !moves.length) return;
    setMoves(moves.slice(0, -1));
    setSelected(null);
    setPending(null);
  };

  let caption: ReactNode = status.text;
  if (puzzle) {
    caption =
      puzzleState === "solved" ? <><strong>Checkmate ♛</strong> {puzzle.solvedCaption}</>
      : puzzleState === "wrong" ? "Not quite. That isn't mate, try again."
      : selected ? "Now pick the square to move to."
      : "White to move. Find the checkmate.";
  }

  // Move list as "1. e4 e5 2. Nf3", showing the most recent moves only.
  const san = history.map((m) => m.san);
  const pairs: string[] = [];
  for (let i = 0; i < san.length; i += 2) pairs.push(`${i / 2 + 1}. ${san[i] ?? ""} ${san[i + 1] ?? ""}`.trim());

  return (
    <figure className="ip-play">
      <div className="ip-board-bar">
        {toolbar}
        <div className="ip-board-actions">
          {puzzle ? (
            puzzleState === "solved"
              ? <button type="button" onClick={reset}>Play it again</button>
              : <button type="button" onClick={() => setHint(true)} disabled={hint}>{hint ? "Hint: the glowing piece" : "Need a hint?"}</button>
          ) : (
            <>
              <button type="button" onClick={undo} disabled={!history.length} aria-label="Undo move" title="Undo move"><Undo2 /></button>
              <button type="button" onClick={() => setFlipped((f) => !f)} aria-label="Flip board" title="Flip board"><FlipVertical2 /></button>
              <button type="button" onClick={reset} disabled={!history.length} aria-label="New game" title="New game"><RotateCcw /></button>
            </>
          )}
        </div>
      </div>
      <div className="ip-board-wrap">
        <div
          key={shake}
          className={`ip-board ${puzzleState === "wrong" ? "is-wrong" : ""} ${puzzleState === "solved" || g.isCheckmate() ? "is-solved" : ""}`}
          role="group"
          aria-label={`Chess board, ${status.text}`}
        >
          {squaresFor(flipped).map((sq, i) => {
            const piece = g.get(sq);
            const target = targets.find((m) => m.to === sq);
            const classes = [
              isDark(sq) ? "is-dark" : "",
              piece ? `has-${piece.color === "w" ? "white" : "black"}` : "",
              piece && piece.color === g.turn() && !locked ? "is-movable" : "",
              selected === sq ? "is-picked" : "",
              target ? (target.captured ? "is-capture" : "is-target") : "",
              last && (last.from === sq || last.to === sq) ? "is-last" : "",
              checkSquare === sq ? "is-check" : "",
              puzzle && hint && puzzleState === "idle" && sq === puzzle.hint ? "is-hint" : "",
            ].join(" ");
            const label = `${sq}${piece ? `, ${SIDE[piece.color].toLowerCase()} ${NAME[piece.type]}` : ""}${target ? ", legal move" : ""}`;
            return (
              <button
                key={sq}
                type="button"
                className={classes}
                aria-label={label}
                aria-pressed={selected === sq}
                draggable={Boolean(piece && piece.color === g.turn() && !locked)}
                onClick={() => press(sq)}
                onDragStart={(e) => dragStart(e, sq)}
                onDragOver={(e) => { if (target) e.preventDefault(); }}
                onDrop={(e) => drop(e, sq)}
              >
                {/* U+FE0E keeps the pawn from rendering as an emoji. */}
                {piece && <span className="ip-piece">{`${GLYPH[piece.type]}︎`}</span>}
                {i % 8 === 0 && <span className="ip-coord ip-rank" aria-hidden>{sq[1]}</span>}
                {i >= 56 && <span className="ip-coord ip-file" aria-hidden>{sq[0]}</span>}
              </button>
            );
          })}
        </div>
        {pending && (
          <div className="ip-promote" role="dialog" aria-label="Promote pawn to">
            {PROMOTIONS.map((p) => (
              <button key={p} type="button" aria-label={NAME[p]} className={g.turn() === "w" ? "has-white" : "has-black"} onClick={() => play(pending.from, pending.to, p)}>
                {`${GLYPH[p]}︎`}
              </button>
            ))}
          </div>
        )}
      </div>
      <figcaption aria-live="polite">{caption}</figcaption>
      {!puzzle && pairs.length > 0 && <p className="ip-moves">{pairs.slice(-4).join("  ")}</p>}
    </figure>
  );
}
