export interface DawdawApi {
  platform: NodeJS.Platform;
  versions: { electron: string; chrome: string; node: string };
  engine: {
    /** Sends one text command to the audio engine, e.g. "noteOn 60" or "noteOff". */
    send(command: string): void;
  };
}

declare global {
  interface Window {
    dawdaw: DawdawApi;
  }
}
