const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { CHARACTER_IDS } = require("../src/character-catalog");

const rendererRoot = path.join(__dirname, "..", "src", "renderer");
const projectRoot = path.join(__dirname, "..");

test("Focus alternates standalone activity frames without a vector overlay", () => {
  const html = fs.readFileSync(path.join(rendererRoot, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(rendererRoot, "styles.css"), "utf8");
  const renderer = fs.readFileSync(path.join(rendererRoot, "renderer.js"), "utf8");

  assert.doesNotMatch(html, /activity-motion/);
  assert.doesNotMatch(css, /activity-motion|page-cue|clapper-cue|radio-level|bobber|game-light/);
  assert.doesNotMatch(css, /focus-activity/);
  assert.match(renderer, /await mountFocusFrames\(\)/);
  assert.match(renderer, /focusFrameElements\.set/);
  assert.match(renderer, /focusFrame\.classList\.remove\("is-hidden"\)/);
  assert.match(renderer, /image\.decode\(\)/);
});

test("every preset ships and loads two standalone Focus frames", () => {
  const preload = fs.readFileSync(path.join(projectRoot, "src", "preload.js"), "utf8");
  assert.match(preload, /focus/);

  for (const characterId of CHARACTER_IDS) {
    for (const frame of ["focus-1.png", "focus-2.png"]) {
      assert.equal(
        fs.existsSync(path.join(projectRoot, "assets", "characters", characterId, frame)),
        true,
        `${characterId} is missing ${frame}`,
      );
    }
  }
});
