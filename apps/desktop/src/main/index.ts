import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "node:path";

import { EngineProcess } from "./engine";

// In development the engine is the binary built under engine/build. Override with DAWDAW_ENGINE.
function engineBinaryPath(): string {
  const exe = process.platform === "win32" ? "dawdaw_engine.exe" : "dawdaw_engine";
  return (
    process.env["DAWDAW_ENGINE"] ??
    join(app.getAppPath(), "../../engine/build/default/dawdaw_engine_artefacts/Debug", exe)
  );
}

function createWindow(): void {
  const win = new BrowserWindow({
    // Content size is 2x the 640x360 logical screen.
    width: 1280,
    height: 720,
    useContentSize: true,
    minWidth: 640,
    minHeight: 360,
    show: false,
    title: "dawdaw",
    backgroundColor: "#1f1f1f",
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  if (process.env["ELECTRON_RENDERER_URL"]) {
    void win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    void win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

void app.whenReady().then(() => {
  const engine = new EngineProcess(engineBinaryPath());
  engine.start();
  app.on("before-quit", () => engine.stop());

  // Fire-and-forget (send, not invoke): nothing waits for a reply, so no extra round trip.
  ipcMain.on("engine:send", (_event, command: unknown) => engine.send(command));

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
