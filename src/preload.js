const { contextBridge, ipcRenderer } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { CHARACTER_CATALOG, CHARACTER_IDS } = require("./character-catalog");

function framesFor(characterId, state) {
  const root = path.join(__dirname, "..", "assets", "characters", characterId);
  if (!fs.existsSync(root)) return [];
  return fs
    .readdirSync(root)
    .filter((file) => file.startsWith(`${state}-`) && file.endsWith(".png"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((file) => {
      const image = fs.readFileSync(path.join(root, file));
      return `data:image/png;base64,${image.toString("base64")}`;
    });
}

function fallbackFrames(characterId, state) {
  const preferred = framesFor(characterId, state);
  if (preferred.length) return preferred;
  if (characterId !== "yellow") return [];
  if (state === "focus") return framesFor(characterId, "working");
  if (state === "sleep") return framesFor(characterId, "break").slice(0, 1);
  if (state === "ready" || state === "complete") return framesFor(characterId, "idle");
  return [];
}

function characterSheet(characterId) {
  const characterRoot = path.join(
    __dirname,
    "..",
    "assets",
    "characters",
    characterId,
  );
  const lockedPath = path.join(characterRoot, "sheet-locked.png");
  const sheetPath = fs.existsSync(lockedPath)
    ? lockedPath
    : path.join(characterRoot, "sheet.png");
  if (!fs.existsSync(sheetPath)) return null;
  return `data:image/png;base64,${fs.readFileSync(sheetPath).toString("base64")}`;
}

const frames = Object.fromEntries(
  CHARACTER_IDS.map((id) => [
    id,
    {
      sheet: characterSheet(id),
      ready: fallbackFrames(id, "ready"),
      focus: fallbackFrames(id, "focus"),
      sleep: fallbackFrames(id, "sleep"),
      complete: fallbackFrames(id, "complete"),
    },
  ]),
);

contextBridge.exposeInMainWorld("daburuDoro", {
  characters: CHARACTER_CATALOG,
  characterIds: CHARACTER_IDS,
  updateInteractionRegions: (regions) => ipcRenderer.send("interaction-regions:update", regions),
  setSessionActive: (active) => ipcRenderer.send("session:set-active", active),
  getPreferences: () => ipcRenderer.invoke("preferences:get"),
  savePreferences: (partial) => ipcRenderer.invoke("preferences:save", partial),
  resetDefaults: () => ipcRenderer.invoke("preferences:reset-defaults"),
  confirmReset: () => ipcRenderer.invoke("session:confirm-reset"),
  hideWidget: () => ipcRenderer.invoke("widget:hide"),
  getManagedAssets: () => ipcRenderer.invoke("assets:get"),
  importArtwork: (characterId) => ipcRenderer.invoke("assets:import-artwork", characterId),
  removeArtwork: (characterId) => ipcRenderer.invoke("assets:remove-artwork", characterId),
  importMusic: (characterId) => ipcRenderer.invoke("assets:import-music", characterId),
  removeMusic: (characterId) => ipcRenderer.invoke("assets:remove-music", characterId),
  showNotification: (body) => ipcRenderer.invoke("notification:show", { body }),
  onAppAction: (callback) => {
    ipcRenderer.on("app-action", (_event, action) => callback(action));
  },
  frames,
});
