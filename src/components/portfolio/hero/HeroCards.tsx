import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, Color, MathUtils, SRGBColorSpace, type Group } from "three";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";
import { interests, profile, type InterestTone } from "../content";
import { loadFaceFonts, paintFace, paintLogo, type FaceColors } from "./cardFace";
import { peekLift } from "./interest-logic";
import { covers } from "./covers";
import { InterestPanel } from "./InterestPanel";

type Palette = Record<"primary" | "secondary" | "accent" | "pink" | "card" | "foreground", string>;

const FALLBACK: Palette = {
  primary: "#e8603c", secondary: "#2f5bd9", accent: "#c6e95a", pink: "#f1a7c0", card: "#fdfbf6", foreground: "#1d1f2b",
};

/**
 * Three.Color cannot parse oklch(), which silently renders everything white.
 * Paint each CSS token into a 1×1 canvas and read back sRGB bytes instead.
 */
function readPalette(): Palette {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const read = (key: keyof Palette) => {
    const value = styles.getPropertyValue(`--${key}`).trim();
    if (!value) return FALLBACK[key];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${new Color(`rgb(${r},${g},${b})`).getHexString()}`;
  };
  return {
    primary: read("primary"), secondary: read("secondary"), accent: read("accent"),
    pink: read("pink"), card: read("card"), foreground: read("foreground"),
  };
}

function faceColors(tone: InterestTone, p: Palette): FaceColors {
  switch (tone) {
    case "card": return { bg: p.card, ink: p.foreground, deco: p.foreground, deco2: p.primary };
    case "pink": return { bg: p.pink, ink: p.foreground, deco: p.foreground, deco2: p.primary };
    case "accent": return { bg: p.accent, ink: p.foreground, deco: p.secondary, deco2: p.primary };
    case "primary": return { bg: p.primary, ink: p.card, deco: p.foreground, deco2: p.pink };
  }
}

function toTexture(canvas: HTMLCanvasElement) {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const CARD_W = 1.5;
const CARD_H = 2.05;
const PEEK_PERIOD = 2.6;

/** Where card i rests in the holder: back cards stand taller and lean further, so every label shows. */
function restPose(i: number, n: number) {
  const k = i - (n - 1) / 2;
  return { x: k * 0.24, y: 0.9 - i * 0.32, z: -0.27 + i * 0.15, rz: -k * 0.13 };
}

interface CardProps {
  index: number;
  color: string;
  face: CanvasTexture | null;
  hovered: boolean;
  selected: boolean;
  dimmed: boolean;
  reduced: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
}

function Card({ index, color, face, hovered, selected, dimmed, reduced, onHover, onSelect }: CardProps) {
  const ref = useRef<Group>(null);
  const rest = restPose(index, interests.length);

  useFrame((state, delta) => {
    const g = ref.current;
    if (!g) return;
    let { x, y, z, rz } = rest;
    let rx = 0;
    let scale = 1;
    if (selected) {
      // Slide up out of the holder and turn to face the viewer.
      x = 0; y = 1.25; z = 1.15; rz = 0; rx = -0.1; scale = 1.08;
    } else if (hovered) {
      y += 0.5; rz *= 0.4; rx = -0.06;
    } else if (dimmed) {
      y -= 0.2;
    } else if (!reduced) {
      // Idle hint: each card peeks out of the holder in turn.
      const t = state.clock.elapsedTime - index * PEEK_PERIOD;
      const turn = Math.floor(state.clock.elapsedTime / PEEK_PERIOD) % interests.length;
      if (turn === index) y += 0.16 * peekLift(t, PEEK_PERIOD);
    }
    const k = reduced ? 1 : 1 - Math.exp(-(selected ? 7 : 9) * delta);
    g.position.set(MathUtils.lerp(g.position.x, x, k), MathUtils.lerp(g.position.y, y, k), MathUtils.lerp(g.position.z, z, k));
    g.rotation.z = MathUtils.lerp(g.rotation.z, rz, k);
    g.rotation.x = MathUtils.lerp(g.rotation.x, rx, k);
    g.scale.setScalar(MathUtils.lerp(g.scale.x, scale, k));
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(index);
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onHover(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(index);
  };

  return (
    <group ref={ref} position={[rest.x, rest.y, rest.z]} rotation={[0, 0, rest.rz]}>
      <RoundedBox args={[CARD_W, CARD_H, 0.03]} radius={0.012} smoothness={2} onPointerOver={over} onPointerOut={out} onClick={click}>
        <meshStandardMaterial color={color} roughness={0.45} />
      </RoundedBox>
      {face && (
        <mesh position={[0, 0, 0.0165]} raycast={() => null}>
          <planeGeometry args={[CARD_W, CARD_H]} />
          <meshStandardMaterial map={face} transparent roughness={0.4} />
        </mesh>
      )}
    </group>
  );
}

interface HolderSceneProps {
  palette: Palette;
  faces: CanvasTexture[];
  logo: CanvasTexture | null;
  hovered: number | null;
  selected: number | null;
  reduced: boolean;
  onHover: (index: number | null) => void;
  onSelect: (index: number) => void;
  onReady: () => void;
}

function HolderScene({ palette, faces, logo, hovered, selected, reduced, onHover, onSelect, onReady }: HolderSceneProps) {
  const group = useRef<Group>(null);
  const ready = useRef(false);

  useFrame((state, delta) => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    const g = group.current;
    if (!g || reduced) return;
    // The whole holder leans toward the pointer and floats gently.
    const k = 1 - Math.exp(-3 * delta);
    const focus = selected !== null;
    g.rotation.y = MathUtils.lerp(g.rotation.y, focus ? 0 : -0.38 + state.pointer.x * 0.3, k);
    g.rotation.x = MathUtils.lerp(g.rotation.x, focus ? 0.05 : 0.16 - state.pointer.y * 0.12, k);
    g.position.y = -0.55 + Math.sin(state.clock.elapsedTime * 0.7) * 0.06;
  });

  const holder = palette.secondary;
  return (
    <group ref={group} position={[0.1, -0.55, 0]} rotation={[0.16, -0.38, -0.06]}>
      {/* Back panel, base and front pocket of the holder. */}
      <RoundedBox args={[2.5, 2.0, 0.1]} radius={0.06} smoothness={3} position={[0, -0.05, -0.45]}>
        <meshStandardMaterial color={holder} roughness={0.85} />
      </RoundedBox>
      <RoundedBox args={[2.5, 0.12, 0.9]} radius={0.05} smoothness={3} position={[0, -1.02, 0]}>
        <meshStandardMaterial color={holder} roughness={0.85} />
      </RoundedBox>
      {interests.map((interest, i) => (
        <Card
          key={interest.kind}
          index={i}
          color={faceColors(interest.tone, palette).bg}
          face={faces[i] ?? null}
          hovered={hovered === i && selected === null}
          selected={selected === i}
          dimmed={selected !== null && selected !== i}
          reduced={reduced}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
      <group position={[0, -0.5, 0.45]}>
        <RoundedBox args={[2.5, 1.15, 0.1]} radius={0.06} smoothness={3}>
          <meshStandardMaterial color={holder} roughness={0.85} />
        </RoundedBox>
        {/* Elastic band across the pocket. */}
        <RoundedBox args={[2.56, 0.16, 0.14]} radius={0.03} smoothness={2} position={[0, 0.36, 0.01]} rotation={[0, 0, -0.04]}>
          <meshStandardMaterial color={palette.card} roughness={0.7} />
        </RoundedBox>
        {logo && (
          <mesh position={[-0.72, -0.2, 0.052]}>
            <planeGeometry args={[0.55, 0.55]} />
            <meshStandardMaterial map={logo} transparent roughness={0.6} />
          </mesh>
        )}
      </group>
    </group>
  );
}

export default function HeroCards() {
  // This component only ever renders client-side (lazy + ClientOnly), so tokens can be read on first render.
  const [palette] = useState<Palette>(readPalette);
  const [faces, setFaces] = useState<CanvasTexture[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = usePrefersReducedMotion();
  const logo = useMemo(() => toTexture(paintLogo(palette.card, palette.primary)), [palette]);

  // Card faces need the web fonts, so paint them once those are ready.
  useEffect(() => {
    let alive = true;
    let made: CanvasTexture[] = [];
    void loadFaceFonts().then(() => {
      if (!alive) return;
      made = interests.map((interest, index) =>
        toTexture(paintFace({
          kind: interest.kind, label: interest.label, index, total: interests.length,
          holder: profile.name, colors: faceColors(interest.tone, palette),
        })),
      );
      setFaces(made);
    });
    return () => {
      alive = false;
      made.forEach((t) => t.dispose());
    };
  }, [palette]);
  useEffect(() => () => logo.dispose(), [logo]);

  // Let the card slide up before the panel opens.
  useEffect(() => {
    if (selected === null) return;
    const id = window.setTimeout(() => setOpen(true), reduced ? 0 : 420);
    return () => window.clearTimeout(id);
  }, [selected, reduced]);

  useEffect(() => {
    document.body.style.cursor = hovered !== null && selected === null ? "pointer" : "";
    return () => { document.body.style.cursor = ""; };
  }, [hovered, selected]);

  // Cover art lives on slow third-party CDNs, so start fetching it the first time someone shows interest.
  const warmed = useRef(false);
  const warmCovers = () => {
    if (warmed.current) return;
    warmed.current = true;
    for (const url of Object.values(covers)) {
      const img = new Image();
      img.referrerPolicy = "no-referrer";
      img.src = url;
    }
  };
  const hover = (index: number | null) => {
    if (index !== null) warmCovers();
    setHovered(index);
  };
  const select = (index: number) => {
    warmCovers();
    setSelected(index);
  };

  const close = () => {
    setOpen(false);
    setSelected(null);
    setHovered(null);
  };
  const active = selected === null ? null : (interests[selected] ?? null);

  return (
    <div className="sculpture-stage" data-scene-ready={ready ? "true" : undefined}>
      <Canvas
        camera={{ position: [0, 0.4, 6], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        aria-hidden
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 5]} intensity={2.2} />
        {/* Local lightformers only: no external HDR preset fetch. */}
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 4, 3]} scale={[6, 4, 1]} />
          <Lightformer intensity={1.2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 8, 1]} />
        </Environment>
        <HolderScene
          palette={palette}
          faces={faces}
          logo={logo}
          hovered={hovered}
          selected={selected}
          reduced={reduced}
          onHover={hover}
          onSelect={select}
          onReady={() => setReady(true)}
        />
      </Canvas>
      <div className="sculpture-controls" role="group" aria-label="What I'm into">
        <span className="holder-hint">what I'm into:</span>
        {interests.map((interest, i) => (
          <button
            key={interest.kind}
            type="button"
            className={`holder-chip tone-${interest.tone}`}
            aria-haspopup="dialog"
            onClick={() => select(i)}
            onMouseEnter={() => hover(i)}
            onMouseLeave={() => hover(null)}
            onFocus={() => hover(i)}
            onBlur={() => hover(null)}
          >
            {interest.label}
          </button>
        ))}
      </div>
      <InterestPanel interest={open ? active : null} onClose={close} />
    </div>
  );
}
