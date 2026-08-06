const test = require("node:test");
const assert = require("node:assert/strict");
const { fadeMultiplier, normalizedVolume, playbackVolume } = require("../src/audio-policy");

test("clamps preferred music volume", () => {
  assert.equal(normalizedVolume(-1), 0);
  assert.equal(normalizedVolume(0.6), 0.6);
  assert.equal(normalizedVolume(2), 1);
  assert.equal(normalizedVolume("invalid"), 0.7);
});

test("fades linearly over the final five seconds", () => {
  assert.equal(fadeMultiplier(6), 1);
  assert.equal(fadeMultiplier(5), 1);
  assert.equal(fadeMultiplier(2.5), 0.5);
  assert.equal(fadeMultiplier(0), 0);
  assert.equal(playbackVolume(0.8, 2.5), 0.4);
});
