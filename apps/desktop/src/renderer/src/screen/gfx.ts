import { FONT_8X8 } from "./font8x8.ts";
import { CELL_H, CELL_W, PALETTE_RGB, SCREEN_H, SCREEN_W, type Shade } from "./theme.ts";

const GLYPH = 8;

/** Software framebuffer of palette indices. Pure data, no DOM, so it can run anywhere. */
export class Framebuffer {
  readonly pixels = new Uint8Array(SCREEN_W * SCREEN_H);

  clear(shade: Shade): void {
    this.pixels.fill(shade);
  }

  px(x: number, y: number, shade: Shade): void {
    if (x < 0 || y < 0 || x >= SCREEN_W || y >= SCREEN_H) return;
    this.pixels[y * SCREEN_W + x] = shade;
  }

  rect(x: number, y: number, w: number, h: number, shade: Shade): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) this.px(xx, yy, shade);
    }
  }

  frame(x: number, y: number, w: number, h: number, shade: Shade): void {
    this.rect(x, y, w, 1, shade);
    this.rect(x, y + h - 1, w, 1, shade);
    this.rect(x, y, 1, h, shade);
    this.rect(x + w - 1, y, 1, h, shade);
  }

  /** Every other pixel, for grid lines. */
  dottedH(x: number, y: number, w: number, shade: Shade): void {
    for (let i = 0; i < w; i += 2) this.px(x + i, y, shade);
  }

  dottedV(x: number, y: number, h: number, shade: Shade): void {
    for (let i = 0; i < h; i += 2) this.px(x, y + i, shade);
  }

  /** Checkerboard fill, the poor man's mid-tone. */
  dither(x: number, y: number, w: number, h: number, shade: Shade): void {
    for (let yy = 0; yy < h; yy++) {
      for (let xx = (yy & 1); xx < w; xx += 2) this.px(x + xx, y + yy, shade);
    }
  }

  /** Writes text on the cell grid. Uppercase only; a background shade fills the cells first. */
  text(col: number, row: number, str: string, fg: Shade, bg?: Shade): void {
    const x0 = col * CELL_W;
    const y0 = row * CELL_H;
    if (bg !== undefined) this.rect(x0, y0, str.length * CELL_W, CELL_H, bg);

    const glyphTop = y0 + ((CELL_H - GLYPH) >> 1);
    for (let i = 0; i < str.length; i++) {
      const code = str.charAt(i).toUpperCase().charCodeAt(0);
      const glyph = FONT_8X8[code < 128 ? code : 63]!;
      for (let gy = 0; gy < GLYPH; gy++) {
        const bits = glyph[gy]!;
        for (let gx = 0; gx < GLYPH; gx++) {
          if (bits & (1 << gx)) this.px(x0 + i * CELL_W + gx, glyphTop + gy, fg);
        }
      }
    }
  }

  toRgba(out: Uint8ClampedArray): void {
    for (let i = 0; i < this.pixels.length; i++) {
      const [r, g, b] = PALETTE_RGB[this.pixels[i]!]!;
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    }
  }
}
