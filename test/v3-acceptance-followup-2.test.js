const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.join(__dirname, "..");
const renderer = fs.readFileSync(path.join(projectRoot, "src", "renderer", "renderer.js"), "utf8");
const main = fs.readFileSync(path.join(projectRoot, "src", "main.js"), "utf8");
const assetBuilder = fs.readFileSync(
  path.join(projectRoot, "scripts", "build-locked-focus-sheets.py"),
  "utf8",
);

test("Green uses the generated hand motion without a synthetic finger", () => {
  assert.match(assetBuilder, /def green_hand_alternate/);
  assert.doesNotMatch(assetBuilder, /draw\.line\(\(329, 372, 338, 405\)/);
  assert.doesNotMatch(assetBuilder, /draw\.ellipse\(\(333, 399, 343, 410\)/);
  assert.match(assetBuilder, /locked\.load\(\)/);
  assert.match(assetBuilder, /compress_level=6/);
  assert.match(assetBuilder, /np\.array_equal\(np\.asarray\(saved_locked\), np\.asarray\(locked\)\)/);
  assert.match(assetBuilder, /master_pixels\[outside_pixels\] != locked_pixels\[outside_pixels\]/);
});

test("the companion picker keeps stable buttons between timer renders", () => {
  assert.match(renderer, /if \(!elements\.characterOptions\.children\.length\)/);
  assert.doesNotMatch(renderer, /characterOptions\.replaceChildren\(\)/);
  assert.match(renderer, /settingsCharacterId = characterId;\s+render\(timer\.snapshot\(\)\);\s+await persistCharacterSession\(\)/);
});

test("visual QA can hold a real Green click across a timer render", () => {
  assert.match(main, /picker-green-delayed-click/);
  assert.match(main, /type: "mouseDown"/);
  assert.match(main, /setTimeout\(resolve, 350\)/);
  assert.match(main, /type: "mouseUp"/);
});
