const { contextBridge, ipcRenderer } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const CHARACTER_ID = "yellow";
const CHARACTER_ROOT = path.join(__dirname, "..", "assets", "characters", CHARACTER_ID);

function framesFor(state) {
  return fs
    .readdirSync(CHARACTER_ROOT)
    .filter((file) => file.startsWith(`${state}-`) && file.endsWith(".png"))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))
    .map((file) => {
      const image = fs.readFileSync(path.join(CHARACTER_ROOT, file));
      return `data:image/png;base64,${image.toString("base64")}`;
    });
}

contextBridge.exposeInMainWorld("daburuDoro", {
  characterId: CHARACTER_ID,
  setMousePassthrough: (shouldIgnore) => {
    ipcRenderer.send("set-mouse-passthrough", shouldIgnore);
  },
  frames: {
    working: framesFor("working"),
    break: framesFor("break"),
  },
});
