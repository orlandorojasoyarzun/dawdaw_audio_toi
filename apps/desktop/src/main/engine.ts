import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

// The only commands the renderer is allowed to forward to the engine.
// "load" is deliberately missing: only the main process may tell the engine which file to read.
const ALLOWED_COMMAND = /^(noteOn \d{1,3}( \d{1,3})?|noteOff( \d{1,3})?|buffer \d{2,4})$/;

/** Runs the C++ audio engine as a child process and talks to it in text lines over stdio. */
export class EngineProcess {
  private child: ChildProcessWithoutNullStreams | null = null;
  private ready = false;
  private readonly binaryPath: string;

  constructor(binaryPath: string) {
    this.binaryPath = binaryPath;
  }

  start(): void {
    const child = spawn(this.binaryPath, [], { stdio: ["pipe", "pipe", "pipe"] });
    this.child = child;

    createInterface({ input: child.stdout }).on("line", (line) => {
      console.log(`[engine] ${line}`);
      if (line !== "ready") return;

      this.ready = true;
      // Development knob for latency tests: DAWDAW_BUFFER=128 pnpm dev
      const buffer = process.env["DAWDAW_BUFFER"];
      if (buffer) this.send(`buffer ${buffer}`);
    });
    child.stderr.on("data", (data) => console.error(`[engine] ${String(data).trimEnd()}`));

    // Writing to a dead engine raises EPIPE; write() already guards against it.
    child.stdin.on("error", () => {});
    child.on("error", (err) => console.error(`[engine] failed to start: ${err.message}`));
    child.on("exit", (code, signal) => {
      this.ready = false;
      this.child = null;
      console.log(`[engine] exited (${code ?? signal})`);
    });
  }

  /** For commands that come from the renderer. Anything not on the allow list is dropped. */
  send(command: unknown): void {
    if (typeof command !== "string" || !ALLOWED_COMMAND.test(command)) return;
    this.write(command);
  }

  /** Asks the engine to load an audio file. Only call this with a path the user picked. */
  load(path: string): void {
    if (/[\r\n]/.test(path)) return; // a newline would smuggle in a second command
    this.write(`load ${path}`);
  }

  stop(): void {
    const child = this.child;
    if (!child) return;
    child.stdin.write("quit\n");
    setTimeout(() => child.kill(), 1000).unref();
  }

  // Drops the line silently if the engine is not ready yet.
  private write(line: string): void {
    if (!this.ready || !this.child) return;
    this.child.stdin.write(`${line}\n`);
  }
}
