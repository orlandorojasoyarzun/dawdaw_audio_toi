import { contextBridge } from "electron";

// Only what the renderer needs, nothing more. The engine bridge will live here later.
contextBridge.exposeInMainWorld("dawdaw", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
});
