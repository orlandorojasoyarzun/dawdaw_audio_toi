export interface DawdawApi {
  platform: NodeJS.Platform;
  versions: { electron: string; chrome: string; node: string };
}

declare global {
  interface Window {
    dawdaw: DawdawApi;
  }
}
