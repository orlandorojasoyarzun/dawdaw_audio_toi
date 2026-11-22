import { contextBridge, ipcRenderer } from "electron";

// Only what the renderer needs, nothing more.
contextBridge.exposeInMainWorld("dawdaw", {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
  },
  engine: {
    send: (command: string): void => ipcRenderer.send("engine:send", command),
    openSample: (): Promise<void> => ipcRenderer.invoke("engine:open-sample"),
  },
});
