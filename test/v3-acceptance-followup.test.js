const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(projectRoot, "src", "renderer", "index.html"), "utf8");
const css = fs.readFileSync(path.join(projectRoot, "src", "renderer", "styles.css"), "utf8");
const renderer = fs.readFileSync(path.join(projectRoot, "src", "renderer", "renderer.js"), "utf8");
const main = fs.readFileSync(path.join(projectRoot, "src", "main.js"), "utf8");
const assetBuilder = fs.readFileSync(
  path.join(projectRoot, "scripts", "build-locked-focus-sheets.py"),
  "utf8",
);

test("Break displays three shared animated sleeping Zs and Pause freezes them", () => {
  assert.match(html, /class="sleep-zs"[^>]*>[\s\S]*<span>Z<\/span><span>Z<\/span><span>Z<\/span>/);
  assert.match(css, /\[data-phase="break"\] \.sleep-zs \{ display: block; \}/);
  assert.match(css, /@keyframes sleeping-z/);
  assert.match(css, /\.widget\.is-paused \.sleep-zs span \{ animation-play-state: paused; \}/);
});

test("the compact timer progress is vertical on the left", () => {
  assert.match(css, /\.progress-handle \{[\s\S]*position: absolute;[\s\S]*left: 0;[\s\S]*height: 172px;/);
  assert.match(css, /\.progress-track \{[\s\S]*bottom: 8px;[\s\S]*width: 7px;/);
  assert.match(css, /transition: height 0\.3s linear/);
  assert.match(renderer, /progressFill\.style\.height/);
});

test("the character Hide affordance is a bare cross", () => {
  assert.match(css, /\.hide-floating \{[\s\S]*border-color: transparent;[\s\S]*background: transparent;[\s\S]*box-shadow: none;/);
});

test("the raster builder contains the three targeted artifact repairs", () => {
  assert.match(assetBuilder, /draw\.line\(\(431, 208, 431, 313\)/);
  assert.match(assetBuilder, /def clean_purple_hand_artifact/);
  assert.match(assetBuilder, /"red": \[\(190, 280\)/);
});

test("visual QA waits for the decoded renderer before interacting", () => {
  assert.match(renderer, /document\.body\.dataset\.ready = "true"/);
  assert.match(main, /document\.body\.dataset\.ready === "true"/);
  assert.match(main, /visual-QA capture failed/);
});
