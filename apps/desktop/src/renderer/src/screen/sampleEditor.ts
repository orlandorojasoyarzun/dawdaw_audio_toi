import type { Framebuffer } from "./gfx.ts";
import { CELL_H, CELL_W, COLS, GRID, INK, PAPER, SCREEN_W } from "./theme.ts";

// Static mockup: nothing here is wired to the engine yet. The waveform is synthesized.

const WAVE_X = CELL_W;
const WAVE_W = SCREEN_W - 2 * CELL_W;

/** Fake kick drum envelope, 0..1, for t in 0..1. Deterministic. */
function amplitude(t: number, column: number): number {
  const attack = Math.min(1, t / 0.012);
  const body = Math.exp(-3.4 * t) * (0.78 + 0.22 * Math.sin(t * 70 * (1 - 0.6 * t)));
  const grit = ((Math.sin(column * 12.9898) * 43758.5453) % 1 + 1) % 1;
  return Math.min(1, attack * (body * (0.88 + 0.12 * grit) + Math.exp(-40 * t) * 0.25));
}

function drawWave(fb: Framebuffer, y: number, h: number): void {
  const mid = y + (h >> 1);
  fb.dottedH(WAVE_X, mid, WAVE_W, GRID);

  for (let i = 0; i < WAVE_W; i++) {
    const half = Math.round(amplitude(i / (WAVE_W - 1), i) * ((h >> 1) - 5));
    fb.rect(WAVE_X + i, mid - half, 1, half * 2 + 1, INK);
  }
}

export function drawSampleEditor(fb: Framebuffer): void {
  fb.clear(PAPER);

  // Row 0: title bar
  fb.text(0, 0, " CLIP: KICK   KICK808.WAV   0.42S   16 STEPS".padEnd(COLS), PAPER, INK);
  fb.text(COLS - 5, 0, "[X1] ", PAPER, INK);

  // Row 1: time ruler, a tick every 10 cells
  for (let col = 1; col < COLS - 8; col += 10) {
    fb.rect(col * CELL_W, CELL_H, 1, CELL_H, INK);
    fb.text(col + 1, 1, `${(((col - 1) / 10) * 0.054).toFixed(2)}S`, INK);
  }

  // Rows 2-19: main waveform
  const waveY = 2 * CELL_H;
  const waveH = 18 * CELL_H;
  for (let col = 1; col < COLS - 8; col += 10) fb.dottedV(col * CELL_W, waveY + 1, waveH - 2, GRID);
  drawWave(fb, waveY, waveH);
  fb.frame(0, waveY, SCREEN_W, waveH, INK);
  fb.text(0, 2, "S", PAPER, INK);
  fb.text(COLS - 1, 2, "E", PAPER, INK);

  // Row 20: parameter tabs, the selected one inverted
  const tabs = ["START", "LOOP-S", "LOOP-E", "END", "", "TUNE", "GAIN", "LOOP"];
  let col = 1;
  for (const [i, name] of tabs.entries()) {
    if (name === "") {
      col += 2;
      continue;
    }
    fb.text(col, 20, `[${name}]`, i === 0 ? PAPER : INK, i === 0 ? INK : undefined);
    col += name.length + 3;
  }

  // Row 21: readout and key hints
  fb.text(1, 21, "START = FILE 0.000S    FRAME 0", INK);
  fb.text(COLS - 17, 21, "Z:PLAY    X:MENU", INK);

  // Rows 22-28: whole-sample overview
  const ovY = 22 * CELL_H;
  const ovH = 7 * CELL_H;
  drawWave(fb, ovY, ovH);
  fb.frame(0, ovY, SCREEN_W, ovH, INK);

  // Row 29: status bar
  fb.text(0, 29, " 124 BPM | STOP | KBD PIANO OCT 4 | OUT 44.1K/512 = 11.6MS".padEnd(COLS), PAPER, INK);
  fb.text(COLS - 7, 29, "DAWDAW ", PAPER, INK);
}
