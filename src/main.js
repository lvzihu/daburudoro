const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

let mainWindow;

app.setName("DaburuDoro");

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 240,
    height: 340,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.webContents.on("console-message", (_event, details) => {
    console.log(`[renderer] ${details.message}`);
  });
  mainWindow.webContents.on("preload-error", (_event, _preloadPath, error) => {
    console.error("Preload failed:", error);
  });
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.on("set-mouse-passthrough", (event, shouldIgnore) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.setIgnoreMouseEvents(shouldIgnore, { forward: true });
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());
