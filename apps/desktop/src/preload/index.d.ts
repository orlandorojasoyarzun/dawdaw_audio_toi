export interface DawdawApi {
  platform: NodeJS.Platform;
  versions: { electron: string; chrome: string; node: string };
  engine: {
    /** Sends one text command to the audio engine, e.g. "noteOn 60" or "noteOff 60". */
    send(command: string): void;
    /** Opens the file picker and loads the chosen audio file into the sampler. */
    openSample(): Promise<void>;
  };
}

declare global {
  interface Window {
    dawdaw: DawdawApi;
  }
}
