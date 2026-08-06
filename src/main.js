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
const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { AssetManager } = require("./asset-manager");
const { CHARACTER_IDS, isCharacterId } = require("./character-catalog");
const { pointInRegions, sanitizeRegions } = require("./pointer-regions");
const { SettingsStore } = require("./settings-store");
const { isPositionVisible, positionAtRightCenter } = require("./window-position");

const WINDOW_WIDTH = 280;
const WINDOW_HEIGHT = 480;
const WINDOW_SIZE = { width: WINDOW_WIDTH, height: WINDOW_HEIGHT };

let mainWindow;
let tray;
let settingsStore;
let isQuitting = false;
let savePositionTimer;
let sessionActive = false;
let assetManager;
let interactionRegions = [];
let mouseInputIgnored = false;
let pointerPollTimer;
let modalInteractionOpen = false;

app.setName("DaburuDoro");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
if (!app.isPackaged && process.env.DABURUDORO_USER_DATA_DIR) {
  app.setPath("userData", process.env.DABURUDORO_USER_DATA_DIR);
}

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
  setMouseInputIgnored(false);
}

function hideWidget() {
  mainWindow?.hide();
}

function setMouseInputIgnored(shouldIgnore) {
  if (!mainWindow || mainWindow.isDestroyed() || mouseInputIgnored === shouldIgnore) return;
  mouseInputIgnored = shouldIgnore;
  mainWindow.setIgnoreMouseEvents(shouldIgnore, { forward: true });
}

function updatePointerAcceptance() {
  if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) return;
  const cursor = screen.getCursorScreenPoint();
  const bounds = mainWindow.getBounds();
  const point = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };
  setMouseInputIgnored(!pointInRegions(point, interactionRegions));
}

function startPointerPolling() {
  clearInterval(pointerPollTimer);
  pointerPollTimer = setInterval(updatePointerAcceptance, 50);
}

async function captureDevelopmentView() {
  const capturePath = process.env.DABURUDORO_CAPTURE_PATH;
  if (app.isPackaged || !capturePath) return;
  const view = process.env.DABURUDORO_CAPTURE_VIEW;
  const requestedCharacter = process.env.DABURUDORO_CAPTURE_CHARACTER;
  await new Promise((resolve) => setTimeout(resolve, 250));
  if (view === "collapsed") {
    await mainWindow.webContents.executeJavaScript(
      '!document.querySelector("#widget").classList.contains("is-collapsed") && document.querySelector("#progress-toggle").click()',
    );
  }
  if (view === "expanded") {
    await mainWindow.webContents.executeJavaScript(
      'document.querySelector("#widget").classList.contains("is-collapsed") && document.querySelector("#progress-toggle").click()',
    );
  }
  if (view === "picker") {
    await mainWindow.webContents.executeJavaScript(
      'document.querySelector("#character-popover").hidden && document.querySelector("#character-menu-toggle").click()',
    );
  }
  const captureCharacter = isCharacterId(requestedCharacter)
    ? requestedCharacter
    : view === "blue"
      ? "blue"
      : null;
  if (captureCharacter) {
    await mainWindow.webContents.executeJavaScript(
      `selectCharacter(${JSON.stringify(captureCharacter)})`,
    );
  }
  if (view === "focus") {
    await mainWindow.webContents.executeJavaScript('document.querySelector("#start").click()');
  }
  if (view === "break") {
    await mainWindow.webContents.executeJavaScript(
      'document.querySelector("#start").click(); setTimeout(() => { const state = timer.tick(Date.now() + preferences.focusMinutes * 60 * 1000); handleTransitions(state); render(state); }, 50)',
    );
  }
  if (view === "complete") {
    await mainWindow.webContents.executeJavaScript(
      'document.querySelector("#start").click(); setTimeout(() => { const state = timer.tick(Date.now() + (preferences.focusMinutes + preferences.breakMinutes) * 60 * 1000 + 1000); handleTransitions(state); render(state); }, 50)',
    );
  }
  const requestedDelay = Number(process.env.DABURUDORO_CAPTURE_DELAY_MS);
  const captureDelay = Number.isFinite(requestedDelay) && requestedDelay >= 0
    ? requestedDelay
    : 900;
  await new Promise((resolve) => setTimeout(resolve, captureDelay));
  const debugState = await mainWindow.webContents.executeJavaScript(
    '({ phase: timer?.phase, character: characterSession?.activeCharacterId, audioLoaded: Boolean(breakAudio?.src), audioPaused: breakAudio?.paused, audioVolume: breakAudio?.volume })',
  );
  console.log("DaburuDoro visual-QA state:", JSON.stringify(debugState));
  const image = await mainWindow.webContents.capturePage();
  fs.writeFileSync(capturePath, image.toPNG());
  isQuitting = true;
  app.quit();
}

function managedAssetSnapshot() {
  const preferences = settingsStore.get();
  const music = {};

  for (const id of CHARACTER_IDS) {
    const audioPath = preferences.characterMusic[id];
    music[id] =
      assetManager.isManagedAudio(audioPath) && fs.existsSync(audioPath)
        ? { url: pathToFileURL(audioPath).href, fileName: path.basename(audioPath) }
        : null;
  }

  return { music };
}

function rendererPreferenceUpdate(partial = {}) {
  const allowed = [
    "focusMinutes",
    "breakMinutes",
    "totalCycles",
    "soundEnabled",
    "expanded",
    "windowPosition",
    "characterId",
    "nextCharacterId",
    "musicVolume",
  ];
  return Object.fromEntries(allowed.filter((key) => key in partial).map((key) => [key, partial[key]]));
}

async function importMusic(characterId) {
  if (!isCharacterId(characterId)) throw new RangeError("Unknown character.");
  modalInteractionOpen = true;
  let result;
  try {
    result = await dialog.showOpenDialog(mainWindow, {
      title: `Choose ${characterId} Break music`,
      properties: ["openFile"],
      filters: [{ name: "Audio", extensions: ["mp3", "m4a", "wav"] }],
    });
  } finally {
    modalInteractionOpen = false;
  }
  if (result.canceled || !result.filePaths[0]) return managedAssetSnapshot();

  const previous = settingsStore.get().characterMusic[characterId];
  const imported = assetManager.importAudio(characterId, result.filePaths[0]);
  const nextMap = { ...settingsStore.get().characterMusic, [characterId]: imported };
  settingsStore.save({ characterMusic: nextMap });
  if (previous && previous !== imported && assetManager.isManagedAudio(previous)) {
    assetManager.remove(previous);
  }
  return managedAssetSnapshot();
}

function removeMusic(characterId) {
  if (!isCharacterId(characterId)) throw new RangeError("Unknown character.");
  const preferences = settingsStore.get();
  const previous = preferences.characterMusic[characterId];
  const nextMap = { ...preferences.characterMusic, [characterId]: null };
  settingsStore.save({ characterMusic: nextMap });
  if (previous && assetManager.isManagedAudio(previous)) assetManager.remove(previous);
  return managedAssetSnapshot();
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
  mainWindow.webContents.once("did-finish-load", () => {
    setMouseInputIgnored(false);
    startPointerPolling();
    captureDevelopmentView();
  });
  mainWindow.on("move", () => {
    clearTimeout(savePositionTimer);
    savePositionTimer = setTimeout(saveWindowPosition, 250);
  });
  mainWindow.on("blur", () => {
    if (!modalInteractionOpen) {
      mainWindow?.webContents.send("app-action", "collapse-controls");
    }
  });
  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideWidget();
  });
  mainWindow.on("closed", () => {
    clearInterval(pointerPollTimer);
    mainWindow = null;
  });
  mainWindow.webContents.on("preload-error", (_event, _preloadPath, error) => {
    console.error("Preload failed:", error);
  });
}

ipcMain.on("interaction-regions:update", (_event, regions) => {
  interactionRegions = sanitizeRegions(regions);
  updatePointerAcceptance();
});
ipcMain.on("session:set-active", (_event, active) => {
  sessionActive = Boolean(active);
});

ipcMain.handle("preferences:get", () => settingsStore.get());
ipcMain.handle("preferences:save", (_event, partial) =>
  settingsStore.save(rendererPreferenceUpdate(partial)),
);
ipcMain.handle("preferences:reset-defaults", () => settingsStore.resetTimerDefaults());
ipcMain.handle("session:confirm-reset", () => confirmEndSession());
ipcMain.handle("widget:hide", () => hideWidget());
ipcMain.handle("assets:get", () => managedAssetSnapshot());
ipcMain.handle("assets:import-music", (_event, characterId) =>
  importMusic(characterId),
);
ipcMain.handle("assets:remove-music", (_event, characterId) =>
  removeMusic(characterId),
);
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
    assetManager = new AssetManager(path.join(app.getPath("userData"), "managed-assets"));
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
