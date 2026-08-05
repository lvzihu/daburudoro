const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_PREFERENCES = Object.freeze({
  focusMinutes: 35,
  breakMinutes: 5,
  totalCycles: 1,
  soundEnabled: true,
  expanded: false,
  windowPosition: null,
});

function positiveInteger(value, fallback) {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
}

function sanitizePreferences(value = {}) {
  const position = value.windowPosition;
  const hasValidPosition =
    position && Number.isFinite(position.x) && Number.isFinite(position.y);

  return {
    focusMinutes: positiveInteger(value.focusMinutes, DEFAULT_PREFERENCES.focusMinutes),
    breakMinutes: positiveInteger(value.breakMinutes, DEFAULT_PREFERENCES.breakMinutes),
    totalCycles: positiveInteger(value.totalCycles, DEFAULT_PREFERENCES.totalCycles),
    soundEnabled:
      typeof value.soundEnabled === "boolean"
        ? value.soundEnabled
        : DEFAULT_PREFERENCES.soundEnabled,
    expanded:
      typeof value.expanded === "boolean" ? value.expanded : DEFAULT_PREFERENCES.expanded,
    windowPosition: hasValidPosition ? { x: position.x, y: position.y } : null,
  };
}

class SettingsStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.preferences = { ...DEFAULT_PREFERENCES };
  }

  load() {
    try {
      const stored = JSON.parse(fs.readFileSync(this.filePath, "utf8"));
      this.preferences = sanitizePreferences(stored);
    } catch (error) {
      if (error.code !== "ENOENT" && error.name !== "SyntaxError") throw error;
      this.preferences = { ...DEFAULT_PREFERENCES };
    }
    return this.get();
  }

  get() {
    return structuredClone(this.preferences);
  }

  save(partial) {
    this.preferences = sanitizePreferences({ ...this.preferences, ...partial });
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(this.preferences, null, 2)}\n`);
    fs.renameSync(temporaryPath, this.filePath);
    return this.get();
  }

  resetTimerDefaults() {
    return this.save({
      focusMinutes: DEFAULT_PREFERENCES.focusMinutes,
      breakMinutes: DEFAULT_PREFERENCES.breakMinutes,
      totalCycles: DEFAULT_PREFERENCES.totalCycles,
      soundEnabled: DEFAULT_PREFERENCES.soundEnabled,
    });
  }
}

module.exports = { SettingsStore, DEFAULT_PREFERENCES, sanitizePreferences };
