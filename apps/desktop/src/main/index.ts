import { app, BrowserWindow } from "electron";
import { join } from "node:path";

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
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
