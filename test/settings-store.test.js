const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  SettingsStore,
  DEFAULT_PREFERENCES,
  sanitizePreferences,
} = require("../src/settings-store");

test("sanitizes invalid persisted values", () => {
  assert.deepEqual(
    sanitizePreferences({
      focusMinutes: 0,
      breakMinutes: "nope",
      totalCycles: 2.5,
      soundEnabled: "yes",
      expanded: 1,
      windowPosition: { x: "left", y: 20 },
      characterId: "orange",
      nextCharacterId: "cyan",
      musicVolume: 5,
      characterMusic: { yellow: 42 },
      characterArtwork: "nope",
    }),
    DEFAULT_PREFERENCES,
  );
});

test("persists valid preferences and merges partial updates", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "daburudoro-settings-"));
  const filePath = path.join(directory, "preferences.json");
  const store = new SettingsStore(filePath);
  store.load();
  store.save({ focusMinutes: 50, windowPosition: { x: 20, y: 30 } });
  store.save({ soundEnabled: false });

  const reloaded = new SettingsStore(filePath).load();
  assert.equal(reloaded.focusMinutes, 50);
  assert.equal(reloaded.soundEnabled, false);
  assert.deepEqual(reloaded.windowPosition, { x: 20, y: 30 });
});

test("resetTimerDefaults keeps display and window preferences", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "daburudoro-settings-"));
  const store = new SettingsStore(path.join(directory, "preferences.json"));
  store.load();
  store.save({
    focusMinutes: 90,
    breakMinutes: 12,
    totalCycles: 4,
    soundEnabled: false,
    expanded: true,
    windowPosition: { x: 100, y: 200 },
    characterId: "purple",
    musicVolume: 0.25,
    characterMusic: { purple: "/managed/purple.mp3" },
    characterArtwork: { purple: "/managed/purple.png" },
  });

  const preferences = store.resetTimerDefaults();
  assert.equal(preferences.focusMinutes, 35);
  assert.equal(preferences.breakMinutes, 5);
  assert.equal(preferences.totalCycles, 1);
  assert.equal(preferences.soundEnabled, true);
  assert.equal(preferences.expanded, true);
  assert.deepEqual(preferences.windowPosition, { x: 100, y: 200 });
  assert.equal(preferences.characterId, "purple");
  assert.equal(preferences.musicVolume, 0.25);
  assert.equal(preferences.characterMusic.purple, "/managed/purple.mp3");
  assert.equal(preferences.characterArtwork.purple, "/managed/purple.png");
});

test("sanitizes character selection and managed asset maps", () => {
  const preferences = sanitizePreferences({
    characterId: "blue",
    nextCharacterId: "red",
    musicVolume: 0,
    characterMusic: { blue: "/managed/blue.m4a", unknown: "/tmp/nope" },
    characterArtwork: { red: "/managed/red.webp" },
  });

  assert.equal(preferences.characterId, "blue");
  assert.equal(preferences.nextCharacterId, "red");
  assert.equal(preferences.musicVolume, 0);
  assert.equal(preferences.characterMusic.blue, "/managed/blue.m4a");
  assert.equal(preferences.characterMusic.unknown, undefined);
  assert.equal(preferences.characterArtwork.red, "/managed/red.webp");
});
