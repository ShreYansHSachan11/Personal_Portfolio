import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, MeshDistortMaterial, OrbitControls } from "@react-three/drei";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { Color, Vector3, type Group, type Mesh } from "three";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

type Palette = { primary: string; secondary: string; accent: string; pink: string; card: string };
type PaletteKey = keyof Palette;

const FALLBACK: Palette = { primary: "coral", secondary: "royalblue", accent: "yellowgreen", pink: "pink", card: "ivory" };
const SWATCHES = [
  { key: "primary", label: "Coral sculpture" },
  { key: "secondary", label: "Cobalt sculpture" },
  { key: "pink", label: "Pink sculpture" },
] as const satisfies readonly { key: PaletteKey; label: string }[];

/**
 * Three.Color cannot parse oklch(), which silently renders everything white.
 * Paint each CSS token into a 1×1 canvas and read back sRGB bytes instead.
 */
function readPalette(): Palette {
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!ctx) return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const read = (key: PaletteKey) => {
    const value = styles.getPropertyValue(`--${key}`).trim();
    if (!value) return FALLBACK[key];
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
    return new Color(`rgb(${r},${g},${b})`).getStyle();
  };
  return { primary: read("primary"), secondary: read("secondary"), accent: read("accent"), pink: read("pink"), card: read("card") };
}

interface SculptureProps {
  palette: Palette;
  mode: number;
  paused: boolean;
  reduced: boolean;
  onReady: () => void;
}

function Sculpture({ palette, mode, paused, reduced, onReady }: SculptureProps) {
  const group = useRef<Group>(null);
  const blob = useRef<Mesh>(null);
  const ready = useRef(false);
  const elapsed = useRef(0);
  const target = useRef(new Vector3(1, 1, 1));
  const still = paused || reduced;

  useFrame((state, delta) => {
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
    if (still) return;
    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    const damping = 1 - Math.exp(-3 * delta);
    const g = group.current;
    if (g) {
      g.rotation.y += (state.pointer.x * 0.22 - g.rotation.y) * damping;
      g.rotation.x += (-state.pointer.y * 0.12 - g.rotation.x) * damping;
      g.position.y = Math.sin(t * 0.7) * 0.12;
    }
    const b = blob.current;
    if (b) {
      b.rotation.y = t * 0.14;
      b.scale.lerp(target.current, 1 - Math.exp(-5 * delta));
    }
  });

  const swatch = SWATCHES[mode]?.key ?? "primary";
  return (
    <group ref={group} rotation={[0.1, -0.2, -0.12]}>
      <mesh
        ref={blob}
        position={[0, 0.1, 0]}
        onPointerOver={() => target.current.setScalar(1.07)}
        onPointerOut={() => target.current.setScalar(1)}
      >
        <icosahedronGeometry args={[1.13, 5]} />
        <MeshDistortMaterial
          color={palette[swatch]}
          distort={mode === 2 ? 0.44 : 0.28}
          speed={still ? 0 : 1.4}
          roughness={0.16}
          metalness={0.22}
          clearcoat={1}
          clearcoatRoughness={0.13}
        />
      </mesh>
      <mesh rotation={[1.05, 0.35, -0.45]}>
        <torusGeometry args={[1.8, 0.16, 24, 100]} />
        <meshPhysicalMaterial color={palette.secondary} metalness={0.5} roughness={0.17} clearcoat={1} />
      </mesh>
      <mesh position={[-1.65, -0.8, 0.4]} rotation={[0.4, 0.3, 0.3]}>
        <octahedronGeometry args={[0.45, 0]} />
        <meshPhysicalMaterial color={palette.accent} roughness={0.3} clearcoat={1} />
      </mesh>
      <mesh position={[1.35, 1.15, -0.25]}>
        <sphereGeometry args={[0.28, 24, 24]} />
        <meshPhysicalMaterial color={palette.pink} roughness={0.15} metalness={0.15} clearcoat={1} />
      </mesh>
      <mesh position={[0.85, -1.5, 0.6]} rotation={[0.3, 0.3, 0.7]}>
        <torusGeometry args={[0.26, 0.1, 16, 40]} />
        <meshPhysicalMaterial color={palette.card} roughness={0.2} metalness={0.55} />
      </mesh>
    </group>
  );
}

export default function HeroBlob() {
  // This component only ever renders client-side (lazy + ClientOnly), so tokens can be read on first render.
  const [palette] = useState<Palette>(readPalette);
  const [mode, setMode] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  // Bumping this remounts the Canvas, restoring the original rotation and camera.
  const [resetKey, setResetKey] = useState(0);
  const reduced = usePrefersReducedMotion();

  const reset = () => {
    setResetKey((v) => v + 1);
    setMode(0);
    setPaused(false);
  };

  return (
    <div className="sculpture-stage" data-scene-ready={ready ? "true" : undefined}>
      <Canvas
        key={resetKey}
        camera={{ position: [0, 0, 6.8], fov: 43 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        aria-label="Interactive 3D sculpture — drag to rotate"
        role="img"
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[3, 5, 5]} intensity={2.8} />
        {/* Local lightformers only: no external HDR preset fetch. */}
        <Environment resolution={128}>
          <Lightformer intensity={3} position={[0, 4, 3]} scale={[6, 4, 1]} />
          <Lightformer intensity={2} position={[-4, 1, 1]} rotation-y={Math.PI / 2} scale={[4, 8, 1]} />
          <Lightformer intensity={1.5} position={[4, -2, 2]} rotation-y={-Math.PI / 2} scale={[3, 6, 1]} />
        </Environment>
        <Sculpture palette={palette} mode={mode} paused={paused} reduced={reduced} onReady={() => setReady(true)} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(Math.PI * 2) / 3}
          autoRotate={!paused && !reduced}
          autoRotateSpeed={0.45}
        />
      </Canvas>
      <div className="sculpture-controls">
        <div className="flex items-center gap-2" role="group" aria-label="Sculpture colors">
          {SWATCHES.map((s, i) => (
            <Button
              key={s.key}
              variant="ghost"
              size="icon"
              aria-label={s.label}
              aria-pressed={mode === i}
              onClick={() => setMode(i)}
              className={`sculpture-swatch swatch-${s.key} ${mode === i ? "is-selected" : ""}`}
            />
          ))}
        </div>
        <span aria-hidden className="mx-2 h-5 border-l border-border" />
        <Button
          size="icon"
          variant="ghost"
          aria-label={paused ? "Play sculpture" : "Pause sculpture"}
          title={paused ? "Play sculpture" : "Pause sculpture"}
          onClick={() => setPaused((v) => !v)}
        >
          {paused ? <Play /> : <Pause />}
        </Button>
        <Button size="icon" variant="ghost" aria-label="Reset sculpture" title="Reset sculpture" onClick={reset}>
          <RotateCcw />
        </Button>
      </div>
    </div>
  );
}
