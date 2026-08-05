const test = require("node:test");
const assert = require("node:assert/strict");
const { isPositionVisible, positionAtRightCenter } = require("../src/window-position");

const windowSize = { width: 280, height: 460 };
const displays = [
  { workArea: { x: 0, y: 25, width: 1440, height: 875 } },
  { workArea: { x: 1440, y: 0, width: 1920, height: 1080 } },
];

test("recognizes a position on either connected display", () => {
  assert.equal(isPositionVisible({ x: 100, y: 100 }, displays, windowSize), true);
  assert.equal(isPositionVisible({ x: 2000, y: 300 }, displays, windowSize), true);
});

test("rejects a saved position outside every display", () => {
  assert.equal(isPositionVisible({ x: 4000, y: 300 }, displays, windowSize), false);
  assert.equal(isPositionVisible(null, displays, windowSize), false);
});

test("places a recovered window at the right-center of the primary work area", () => {
  assert.deepEqual(positionAtRightCenter(displays[0].workArea, windowSize), {
    x: 1132,
    y: 233,
  });
});
