// Logical screen: 80x30 text cells of 8x12 px, scaled up by whole numbers only.
// The 8x8 glyph is centered in the cell, leaving 2px of line spacing above and below.
export const CELL_W = 8;
export const CELL_H = 12;
export const COLS = 80;
export const ROWS = 30;
export const SCREEN_W = COLS * CELL_W; // 640
export const SCREEN_H = ROWS * CELL_H; // 360

// Shades, lightest to darkest. Every drawing call uses these indices, never RGB,
// so the whole look can be changed here.
export const PAPER = 0;
export const GRID = 1;
export const SHADOW = 2;
export const INK = 3;
export type Shade = 0 | 1 | 2 | 3;

export const PALETTE_RGB: readonly (readonly [number, number, number])[] = [
  [0xc4, 0xcf, 0xa1],
  [0x8b, 0x95, 0x6d],
  [0x4d, 0x53, 0x3c],
  [0x1f, 0x1f, 0x1f],
];
