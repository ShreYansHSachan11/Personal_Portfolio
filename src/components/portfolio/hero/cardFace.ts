import type { InterestKind } from "../content";

export const FACE_W = 600;
export const FACE_H = 820;

export interface FaceColors { bg: string; ink: string; deco: string; deco2: string }
export interface FaceSpec { kind: InterestKind; label: string; index: number; total: number; holder: string; colors: FaceColors }

const FONTS = ["800 80px Syne", "italic 40px 'Instrument Serif'", "600 26px Manrope"];

/** Resolves once the card fonts are usable on a canvas (or immediately if loading fails). */
export async function loadFaceFonts(): Promise<void> {
  try {
    await Promise.all(FONTS.map((f) => document.fonts.load(f)));
  } catch {
    // Canvas falls back to system fonts; the cards still render.
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function decorate(ctx: CanvasRenderingContext2D, kind: InterestKind, c: FaceColors) {
  ctx.save();
  switch (kind) {
    case "chess": {
      // A corner of a board, falling off the card edge.
      const s = 78;
      for (let r = 0; r < 5; r++) {
        for (let f = 0; f < 5; f++) {
          if ((r + f) % 2) continue;
          ctx.fillStyle = r + f < 3 ? c.deco2 : c.deco;
          ctx.fillRect(FACE_W - s * (f + 1) + 40, FACE_H - s * (r + 1) + 30, s, s);
        }
      }
      ctx.fillStyle = c.ink;
      ctx.font = "260px serif";
      ctx.fillText("♞", 70, 560);
      break;
    }
    case "music": {
      // A record peeking out of its sleeve.
      const cx = 400;
      const cy = 470;
      ctx.fillStyle = c.deco;
      ctx.beginPath();
      ctx.arc(cx, cy, 250, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c.bg;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 3;
      for (let r = 90; r < 245; r += 22) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = c.deco2;
      ctx.beginPath();
      ctx.arc(cx, cy, 72, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.bg;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "books": {
      // A short shelf of spines.
      const spines = [
        [60, 300, c.deco], [128, 250, c.deco2], [178, 330, c.ink], [252, 280, c.deco], [316, 230, c.bg],
      ] as const;
      ctx.translate(0, 650);
      for (const [x, h, color] of spines) {
        ctx.fillStyle = color;
        roundRect(ctx, x, -h, 58, h, 8);
        ctx.fill();
        ctx.strokeStyle = c.ink;
        ctx.lineWidth = 4;
        ctx.stroke();
      }
      ctx.rotate(-0.32);
      ctx.fillStyle = c.deco2;
      roundRect(ctx, 330, 30, 64, 300, 8);
      ctx.fill();
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = c.ink;
      ctx.fillRect(40, 650, FACE_W - 80, 8);
      break;
    }
    case "movies": {
      // A strip of film running diagonally across the card.
      ctx.translate(FACE_W / 2, FACE_H / 2 + 60);
      ctx.rotate(-0.42);
      ctx.fillStyle = c.deco;
      ctx.fillRect(-520, -95, 1040, 190);
      ctx.fillStyle = c.bg;
      for (let x = -500; x < 520; x += 52) {
        roundRect(ctx, x, -82, 26, 20, 5);
        ctx.fill();
        roundRect(ctx, x, 62, 26, 20, 5);
        ctx.fill();
      }
      ctx.fillStyle = c.deco2;
      for (let x = -470; x < 520; x += 170) {
        roundRect(ctx, x, -48, 140, 96, 10);
        ctx.fill();
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = c.ink;
      ctx.font = "150px serif";
      ctx.fillText("★", 380, 300);
      break;
    }
  }
  ctx.restore();
}

/** Paints one card face. Rounded corners stay transparent so the plane matches the card body. */
export function paintFace(spec: FaceSpec): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { colors: c } = spec;

  roundRect(ctx, 0, 0, FACE_W, FACE_H, 48);
  ctx.fillStyle = c.bg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  decorate(ctx, spec.kind, c);
  ctx.restore();

  ctx.fillStyle = c.ink;
  ctx.textBaseline = "alphabetic";
  ctx.font = "800 80px Syne";
  ctx.fillText(spec.label, 44, 112);
  ctx.font = "600 26px Manrope";
  ctx.textAlign = "right";
  ctx.fillText(`${String(spec.index + 1).padStart(2, "0")}/${String(spec.total).padStart(2, "0")}`, FACE_W - 44, 66);
  ctx.textAlign = "left";

  // A card "chip" and the holder's name, like the bank cards this borrows from.
  ctx.fillStyle = c.deco2;
  roundRect(ctx, 44, FACE_H - 150, 84, 62, 12);
  ctx.fill();
  ctx.strokeStyle = c.ink;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(44, FACE_H - 119);
  ctx.lineTo(128, FACE_H - 119);
  ctx.moveTo(86, FACE_H - 150);
  ctx.lineTo(86, FACE_H - 88);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.ink;
  ctx.font = "600 26px Manrope";
  ctx.fillText(spec.holder.toUpperCase(), 44, FACE_H - 44);
  ctx.font = "italic 40px 'Instrument Serif'";
  ctx.textAlign = "right";
  ctx.fillText("tap to open", FACE_W - 44, FACE_H - 44);
  return canvas;
}

/** Paints the holder's front logo: "S." with a coral dot. */
export function paintLogo(ink: string, dot: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.font = "800 190px Syne";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.fillText("S", 40, 140);
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(180, 196, 22, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}
