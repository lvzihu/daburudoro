const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  Tray,
} = require("electron");
const path = require("node:path");
const { SettingsStore } = require("./settings-store");
const { isPositionVisible, positionAtRightCenter } = require("./window-position");

const WINDOW_WIDTH = 280;
const WINDOW_HEIGHT = 460;
const WINDOW_SIZE = { width: WINDOW_WIDTH, height: WINDOW_HEIGHT };

let mainWindow;
let tray;
let settingsStore;
let isQuitting = false;
let savePositionTimer;
let sessionActive = false;

app.setName("DaburuDoro");

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

function initialWindowPosition() {
  const saved = settingsStore.get().windowPosition;
  if (isPositionVisible(saved, screen.getAllDisplays(), WINDOW_SIZE)) return saved;

  const { workArea } = screen.getPrimaryDisplay();
  return positionAtRightCenter(workArea, WINDOW_SIZE);
}

function saveWindowPosition() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [x, y] = mainWindow.getPosition();
  settingsStore.save({ windowPosition: { x, y } });
}

function ensureWindowIsVisible() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const [x, y] = mainWindow.getPosition();
  if (isPositionVisible({ x, y }, screen.getAllDisplays(), WINDOW_SIZE)) return;
  const nextPosition = initialWindowPosition();
  mainWindow.setPosition(nextPosition.x, nextPosition.y);
  saveWindowPosition();
}

function showWidget() {
  if (!mainWindow || mainWindow.isDestroyed()) createWindow();
  ensureWindowIsVisible();
  mainWindow.show();
  mainWindow.focus();
}

function hideWidget() {
  mainWindow?.hide();
}

async function confirmEndSession(message = "End this session?") {
  const result = await dialog.showMessageBox(mainWindow, {
    type: "question",
    title: "DaburuDoro",
    message,
    detail: "Your saved timer settings will not change.",
    buttons: ["Keep Working", "End Session"],
    defaultId: 0,
    cancelId: 0,
  });
  return result.response === 1;
}

async function restartSession() {
  showWidget();
  if (!sessionActive) {
    mainWindow.webContents.send("app-action", "restart-session");
    return;
  }
  const confirmed = await confirmEndSession("Restart this session from the beginning?");
  if (confirmed) mainWindow.webContents.send("app-action", "restart-session");
}

function createTray() {
  const iconPath = path.join(
    __dirname,
    "..",
    "assets",
    "characters",
    "yellow",
    "working-1.png",
  );
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  trayIcon.setTemplateImage(true);
  tray = new Tray(trayIcon);
  tray.setToolTip("DaburuDoro");

  const menu = Menu.buildFromTemplate([
    { label: "Show Widget", click: showWidget },
    { label: "Hide Widget", click: hideWidget },
    { type: "separator" },
    { label: "Restart Session…", click: restartSession },
    { type: "separator" },
    {
      label: "Quit DaburuDoro",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  tray.on("click", () => (mainWindow?.isVisible() ? hideWidget() : showWidget()));
}

function createWindow() {
  const position = initialWindowPosition();
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    x: position.x,
    y: position.y,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    show: false,
    title: "DaburuDoro",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, "floating");
  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("move", () => {
    clearTimeout(savePositionTimer);
    savePositionTimer = setTimeout(saveWindowPosition, 250);
  });
  mainWindow.on("blur", () => {
    mainWindow?.webContents.send("app-action", "collapse-controls");
  });
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideWidget();
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("preload-error", (_event, _preloadPath, error) => {
    console.error("Preload failed:", error);
  });
}

ipcMain.on("set-mouse-passthrough", (event, shouldIgnore) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  window?.setIgnoreMouseEvents(shouldIgnore, { forward: true });
});
ipcMain.on("session:set-active", (_event, active) => {
  sessionActive = Boolean(active);
});

ipcMain.handle("preferences:get", () => settingsStore.get());
ipcMain.handle("preferences:save", (_event, partial) => settingsStore.save(partial));
ipcMain.handle("preferences:reset-defaults", () => settingsStore.resetTimerDefaults());
ipcMain.handle("session:confirm-reset", () => confirmEndSession());
ipcMain.handle("widget:hide", () => hideWidget());
ipcMain.handle("notification:show", (_event, { body }) => {
  if (!Notification.isSupported()) return false;
  new Notification({ title: "DaburuDoro", body, silent: true }).show();
  return true;
});

if (hasSingleInstanceLock) {
  app.on("second-instance", showWidget);

  app.whenReady().then(() => {
    settingsStore = new SettingsStore(path.join(app.getPath("userData"), "preferences.json"));
    settingsStore.load();
    createWindow();
    createTray();

    screen.on("display-removed", ensureWindowIsVisible);
    screen.on("display-metrics-changed", ensureWindowIsVisible);
    app.on("activate", showWidget);
  });
}

app.on("before-quit", () => {
  isQuitting = true;
  saveWindowPosition();
});
