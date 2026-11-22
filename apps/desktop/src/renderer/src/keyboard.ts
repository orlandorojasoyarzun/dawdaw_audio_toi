type Engine = Window["dawdaw"]["engine"];

// Computer keyboard as a piano, Ableton style: the home row is the white keys,
// the row above is the black keys. A is middle C.
const BASE_NOTE = 60;
const PIANO_KEYS = new Map<string, number>([
  ["KeyA", 0], // C
  ["KeyW", 1], // C#
  ["KeyS", 2], // D
  ["KeyE", 3], // D#
  ["KeyD", 4], // E
  ["KeyF", 5], // F
  ["KeyT", 6], // F#
  ["KeyG", 7], // G
  ["KeyY", 8], // G#
  ["KeyH", 9], // A
  ["KeyU", 10], // A#
  ["KeyJ", 11], // B
  ["KeyK", 12], // C
]);

/** Wires the keyboard to the engine. Returns a function that removes the listeners. */
export function installKeyboard(engine: Engine): () => void {
  // Which note each physical key started, so its release always stops the same note.
  const held = new Map<string, number>();

  const releaseAll = () => {
    for (const note of held.values()) engine.send(`noteOff ${note}`);
    held.clear();
  };

  const press = (event: KeyboardEvent) => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.code === "KeyO") {
      // The file dialog swallows key-up events, so stop everything first.
      releaseAll();
      void engine.openSample();
      return;
    }

    const offset = PIANO_KEYS.get(event.code);
    if (offset === undefined || held.has(event.code)) return;

    const note = BASE_NOTE + offset;
    held.set(event.code, note);
    engine.send(`noteOn ${note}`);
  };

  const release = (event: KeyboardEvent) => {
    const note = held.get(event.code);
    if (note === undefined) return;

    held.delete(event.code);
    engine.send(`noteOff ${note}`);
  };

  addEventListener("keydown", press);
  addEventListener("keyup", release);
  addEventListener("blur", releaseAll);
  return () => {
    removeEventListener("keydown", press);
    removeEventListener("keyup", release);
    removeEventListener("blur", releaseAll);
  };
}
