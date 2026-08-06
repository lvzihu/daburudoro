const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rendererRoot = path.join(__dirname, "..", "src", "renderer");

test("Focus alternates the two artwork panels without a vector overlay", () => {
  const html = fs.readFileSync(path.join(rendererRoot, "index.html"), "utf8");
  const css = fs.readFileSync(path.join(rendererRoot, "styles.css"), "utf8");

  assert.doesNotMatch(html, /activity-motion/);
  assert.doesNotMatch(css, /activity-motion|page-cue|clapper-cue|radio-level|bobber|game-light/);
  assert.match(css, /\[data-phase="focus"\] \.character-sprite/);
  assert.match(css, /animation: focus-activity/);
  assert.match(css, /background-position: 50% 0%/);
  assert.match(css, /background-position: 100% 0%/);
  assert.match(css, /\.widget\.is-paused \.character-sprite/);
});
