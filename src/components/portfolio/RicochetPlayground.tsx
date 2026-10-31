import Matter from "matter-js";
import { ArrowRight, Circle, MoveUpRight, Pause, Play, Rocket, RotateCcw, Square, Triangle, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { hitScore, isOutOfShots, launchVelocity, scenarios, SHOT_LIMIT } from "./playground-rules";

const WIDTH = 840;
const HEIGHT = 460;
const LAUNCHER = { x: 95, y: 350 } as const;
const MAX_BODIES = 35;
const DEFAULT_ANGLE = -0.58;
const DEFAULT_GRAVITY = 0.3;
const MAX_STEP_MS = 1000 / 60;
const MAX_FRAME_MS = 33.33;

type Shape = "circle" | "square" | "triangle";
type Status = "playing" | "won" | "lost";
type GameState = { hits: number; shots: number; score: number; status: Status };

const INITIAL: GameState = { hits: 0, shots: 0, score: 0, status: "playing" };
const SHAPES = [
  ["circle", Circle],
  ["square", Square],
  ["triangle", Triangle],
] as const;
const PROJECTILE = { restitution: 0.82, friction: 0.025, frictionAir: 0.0015, density: 0.002, label: "ball" } as const;

function createProjectile(shape: Shape) {
  const { x, y } = LAUNCHER;
  if (shape === "square") return Matter.Bodies.rectangle(x, y, 28, 28, PROJECTILE);
  if (shape === "triangle") return Matter.Bodies.polygon(x, y, 3, 19, PROJECTILE);
  return Matter.Bodies.circle(x, y, 15, PROJECTILE);
}

/** Reads semantic colour tokens so every drawn pixel follows the design system. */
function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(`--${name}`).trim();
  const ink = token("foreground");
  return {
    ink,
    paper: token("card"),
    dots: token("border"),
    primary: token("primary") || ink,
    secondary: token("secondary") || ink,
    accent: token("accent") || ink,
    pink: token("pink") || ink,
  };
}

export function RicochetPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const launchRef = useRef<() => void>(() => {});
  const [level, setLevel] = useState(0);
  const [sandbox, setSandbox] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [shape, setShape] = useState<Shape>("circle");
  const [gravity, setGravity] = useState(DEFAULT_GRAVITY);
  const [game, setGame] = useState<GameState>(INITIAL);

  // Live values read by the physics loop without rebuilding the world.
  const pausedRef = useRef(paused);
  const shapeRef = useRef(shape);
  const gravityRef = useRef(gravity);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { shapeRef.current = shape; }, [shape]);
  useEffect(() => { gravityRef.current = gravity; }, [gravity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const scenario = scenarios[level];
    if (!canvas || !ctx || !scenario) return;

    const colors = readTokens();
    const shotColors = [colors.primary, colors.secondary, colors.accent, colors.pink];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const engine = Matter.Engine.create();
    const world = engine.world;
    const boundary = [
      Matter.Bodies.rectangle(420, 475, 900, 30, { isStatic: true }),
      Matter.Bodies.rectangle(-15, 230, 30, 500, { isStatic: true }),
      Matter.Bodies.rectangle(855, 230, 30, 500, { isStatic: true }),
      Matter.Bodies.rectangle(420, -15, 900, 30, { isStatic: true }),
    ];
    const walls = sandbox ? [] : scenario.walls.map(([x, y, w, h]) => Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, chamfer: { radius: 4 } }));
    const targets = sandbox ? [] : scenario.targets.map(([x, y]) => Matter.Bodies.circle(x, y, 24, { isStatic: true, isSensor: true, label: "target" }));
    Matter.Composite.add(world, [...boundary, ...walls, ...targets]);

    // Per-frame data lives here, outside React; only scoreboard changes are published.
    const balls: { body: Matter.Body; color: string }[] = [];
    const state: GameState = { ...INITIAL };
    const hitIds: number[] = [];
    let aim: { x: number; y: number } | null = null;
    let angle = DEFAULT_ANGLE;
    let frame = 0;
    let last = 0;
    let sinceShot = 0;
    let clock = 0;
    const publish = () => setGame({ ...state });
    const canPlay = () => !pausedRef.current && (sandbox || state.status === "playing");

    const launch = (x = Math.cos(angle) * 220, y = Math.sin(angle) * 220) => {
      if (!canPlay() || (!sandbox && state.shots >= SHOT_LIMIT)) return;
      const body = createProjectile(shapeRef.current);
      Matter.Body.setVelocity(body, launchVelocity(x, y));
      Matter.Body.setAngularVelocity(body, 0.07);
      Matter.Composite.add(world, body);
      balls.push({ body, color: shotColors[state.shots % shotColors.length] ?? colors.ink });
      if (balls.length > MAX_BODIES) {
        const oldest = balls.shift();
        if (oldest) Matter.Composite.remove(world, oldest.body);
      }
      state.shots++;
      sinceShot = 0;
      publish();
    };
    launchRef.current = () => launch();

    const onCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of event.pairs) {
        const target = pair.bodyA.label === "target" ? pair.bodyA : pair.bodyB.label === "target" ? pair.bodyB : undefined;
        const isBall = pair.bodyA.label === "ball" || pair.bodyB.label === "ball";
        if (!target || !isBall || state.status !== "playing") continue;
        const points = hitScore(hitIds, target.id);
        if (!points) continue;
        hitIds.push(target.id);
        state.score += points;
        state.hits++;
        if (state.hits === targets.length) state.status = "won";
        publish();
      }
    };
    Matter.Events.on(engine, "collisionStart", onCollision);

    // Map CSS pixels back to logical board coordinates, whatever size the canvas is drawn at.
    const toBoard = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * WIDTH) / r.width, y: ((e.clientY - r.top) * HEIGHT) / r.height };
    };
    const onDown = (e: PointerEvent) => {
      if (!canPlay()) return;
      aim = toBoard(e);
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => { if (aim) aim = toBoard(e); };
    const onUp = () => {
      if (!aim) return;
      launch(aim.x - LAUNCHER.x, aim.y - LAUNCHER.y);
      aim = null;
    };
    const onCancel = () => { aim = null; };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        launch();
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        angle = Math.max(-1.5, Math.min(0.6, angle + (e.key === "ArrowUp" ? -0.1 : 0.1)));
      }
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onCancel);
    canvas.addEventListener("keydown", onKey);

    const traceBody = (body: Matter.Body, fill: string) => {
      const [first, ...rest] = body.vertices;
      if (!first) return;
      ctx.beginPath();
      ctx.moveTo(first.x, first.y);
      for (const v of rest) ctx.lineTo(v.x, v.y);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== WIDTH * ratio) {
        canvas.width = WIDTH * ratio;
        canvas.height = HEIGHT * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = colors.paper;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = colors.dots;
      for (let x = 18; x < WIDTH; x += 24) {
        for (let y = 18; y < HEIGHT; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (const w of walls) traceBody(w, colors.ink);

      targets.forEach((t, i) => {
        const hit = hitIds.includes(t.id);
        const pulse = reducedMotion.matches ? 0 : Math.sin(clock / 450 + i) * 2;
        ctx.beginPath();
        ctx.arc(t.position.x, t.position.y, hit ? 19 : 24 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = hit ? colors.accent : colors.pink;
        ctx.fill();
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = colors.ink;
        ctx.font = "bold 17px Manrope, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(hit ? "✓" : String(i + 1), t.position.x, t.position.y + 6);
      });
      for (const b of balls) traceBody(b.body, b.color);

      if (sandbox || state.status === "playing") {
        const end = aim ?? { x: LAUNCHER.x + Math.cos(angle) * 180, y: LAUNCHER.y + Math.sin(angle) * 180 };
        ctx.setLineDash([5, 7]);
        ctx.strokeStyle = colors.secondary;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(LAUNCHER.x, LAUNCHER.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(end.x, end.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(LAUNCHER.x, LAUNCHER.y, 27, 0, Math.PI * 2);
      ctx.fillStyle = colors.secondary;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(LAUNCHER.x, LAUNCHER.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = colors.paper;
      ctx.fill();
      ctx.fillStyle = colors.ink;
      ctx.font = "12px Manrope, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`RICOCHET / ${sandbox ? "FREE PLAY" : `0${level + 1}`}`, 22, 30);
    };

    const tick = (now: number) => {
      const dt = Math.min(now - (last || now), MAX_FRAME_MS);
      last = now;
      if (!pausedRef.current) {
        engine.gravity.y = sandbox ? gravityRef.current : scenario.gravity;
        // Matter.js is only stable at ≤16.67 ms per step, so long frames are split into substeps.
        const elapsed = dt || MAX_STEP_MS;
        const steps = Math.ceil(elapsed / MAX_STEP_MS);
        for (let i = 0; i < steps; i++) Matter.Engine.update(engine, elapsed / steps);
        clock += dt;
        sinceShot += dt;
        if (!sandbox && state.status === "playing" && isOutOfShots(state.shots, sinceShot)) {
          state.status = "lost";
          publish();
        }
      }
      render();
      frame = requestAnimationFrame(tick);
    };

    // Only simulate while the board is on screen; off-screen time doesn't advance the game.
    const start = () => {
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const visibility = new IntersectionObserver(([entry]) => (entry?.isIntersecting ? start() : stop()));
    visibility.observe(canvas);
    render();

    return () => {
      stop();
      visibility.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("keydown", onKey);
      Matter.Events.off(engine, "collisionStart", onCollision);
      Matter.Composite.clear(world, false);
      Matter.Engine.clear(engine);
      launchRef.current = () => {};
    };
  }, [level, sandbox, resetKey]);

  /** Every world rebuild starts from a clean scoreboard and an unpaused game. */
  const rebuild = (changes: { level?: number; sandbox?: boolean } = {}) => {
    setPaused(false);
    setGame(INITIAL);
    if (changes.level !== undefined) setLevel(changes.level);
    if (changes.sandbox !== undefined) setSandbox(changes.sandbox);
    setResetKey((v) => v + 1);
  };

  const isLastLevel = level >= scenarios.length - 1;
  const overlay = paused
    ? { title: "Take a breather.", detail: "Game paused", action: "Resume", run: () => setPaused(false) }
    : game.status === "won"
      ? isLastLevel
        ? { title: "Beautifully played.", detail: `${game.score} points · ${game.shots} shots`, action: "Play again", run: () => rebuild() }
        : { title: "Beautifully played.", detail: `${game.score} points · ${game.shots} shots`, action: "Next challenge", run: () => rebuild({ level: level + 1 }) }
      : game.status === "lost"
        ? { title: "One more bounce?", detail: `${game.hits} of 3 targets collected`, action: "Play again", run: () => rebuild() }
        : null;
  const launchDisabled = paused || (!sandbox && (game.status !== "playing" || game.shots >= SHOT_LIMIT));

  return (
    <div className="ricochet-game">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Game mode" className="flex gap-1 rounded-full border border-border bg-card/60 p-1">
          <Button variant={!sandbox ? "secondary" : "ghost"} aria-pressed={!sandbox} className="rounded-full" onClick={() => rebuild({ sandbox: false })}>
            Challenges
          </Button>
          <Button variant={sandbox ? "secondary" : "ghost"} aria-pressed={sandbox} className="rounded-full" onClick={() => rebuild({ sandbox: true })}>
            Free play
          </Button>
        </div>
        <div className="flex items-center gap-5 font-display text-sm" aria-live="polite">
          <span className="flex items-center gap-2"><Trophy aria-hidden className="size-4 text-primary" /><span className="sr-only">Score:</span>{game.score}</span>
          <span>{sandbox ? `${game.shots} launched` : `${game.hits}/3 targets · ${Math.max(0, SHOT_LIMIT - game.shots)} shots`}</span>
        </div>
      </div>

      {!sandbox && (
        <div role="group" aria-label="Scenarios" className="mb-5 flex flex-wrap gap-2">
          {scenarios.map((s, i) => (
            <Button key={s.name} variant={level === i ? "outline" : "ghost"} aria-pressed={level === i} className="rounded-full" onClick={() => rebuild({ level: i })}>
              {String(i + 1).padStart(2, "0")} / {s.name}
            </Button>
          ))}
        </div>
      )}

      <div className="ricochet-board relative overflow-hidden rounded-lg border-2 border-foreground bg-card shadow-pop">
        <canvas
          ref={canvasRef}
          className="block h-full w-full cursor-crosshair touch-none"
          tabIndex={0}
          aria-label="Ricochet game. Aim by pressing and moving, release to launch. Arrow up and down aim; Space launches."
          data-game-state={game.status}
        />
        {overlay && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm">
            <span className="font-serif text-4xl italic">{overlay.title}</span>
            <p className="text-sm">{overlay.detail}</p>
            <Button onClick={overlay.run}>{overlay.action}<ArrowRight /></Button>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <div role="group" aria-label="Projectile shape" className="flex items-center gap-1">
          {SHAPES.map(([s, Icon]) => (
            <Button key={s} size="icon" variant={shape === s ? "secondary" : "ghost"} aria-label={`${s} projectile`} title={`${s} projectile`} aria-pressed={shape === s} onClick={() => setShape(s)}>
              <Icon />
            </Button>
          ))}
          <span aria-hidden className="mx-2 h-5 border-l border-border" />
          <Button variant="ghost" size="icon" title={paused ? "Resume game" : "Pause game"} aria-label={paused ? "Resume game" : "Pause game"} onClick={() => setPaused((v) => !v)}>
            {paused ? <Play /> : <Pause />}
          </Button>
          <Button variant="ghost" size="icon" title="Restart game" aria-label="Restart game" onClick={() => rebuild()}>
            <RotateCcw />
          </Button>
        </div>
        {sandbox && (
          <label className="flex items-center gap-3 text-xs">
            Gravity
            <input aria-label="Gravity" type="range" min="-0.5" max="1" step="0.05" value={gravity} onChange={(e) => setGravity(Number(e.target.value))} className="w-24 accent-primary" />
            <span className="w-8 tabular-nums">{gravity.toFixed(2)}</span>
          </label>
        )}
        <Button className="rounded-full" disabled={launchDisabled} onClick={() => launchRef.current()}>
          <Rocket />Launch<MoveUpRight />
        </Button>
      </div>
    </div>
  );
}
