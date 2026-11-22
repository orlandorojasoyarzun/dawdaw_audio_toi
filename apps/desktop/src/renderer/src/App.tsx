import { useEffect, useRef } from "react";

import { installKeyboard } from "./keyboard.ts";
import { Framebuffer } from "./screen/gfx.ts";
import { drawSampleEditor } from "./screen/sampleEditor.ts";
import { SCREEN_H, SCREEN_W } from "./screen/theme.ts";

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const fb = new Framebuffer();
    drawSampleEditor(fb);
    const image = ctx.createImageData(SCREEN_W, SCREEN_H);
    fb.toRgba(image.data);
    ctx.putImageData(image, 0, 0);

    // Whole-number scaling only, so pixels stay square and crisp.
    const fit = () => {
      const scale = Math.max(1, Math.floor(Math.min(innerWidth / SCREEN_W, innerHeight / SCREEN_H)));
      canvas.style.width = `${SCREEN_W * scale}px`;
      canvas.style.height = `${SCREEN_H * scale}px`;
    };
    fit();
    addEventListener("resize", fit);
    return () => removeEventListener("resize", fit);
  }, []);

  useEffect(() => installKeyboard(window.dawdaw.engine), []);

  return (
    <main className="screen">
      <canvas ref={canvasRef} width={SCREEN_W} height={SCREEN_H} />
    </main>
  );
}
