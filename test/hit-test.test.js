const test = require("node:test");
const assert = require("node:assert/strict");
const { pointInRegions, sanitizeRegions } = require("../src/pointer-regions");

test("accepts points inside any active interaction rectangle", () => {
  const regions = [
    { x: 10, y: 10, width: 100, height: 50 },
    { x: 20, y: 100, width: 40, height: 40 },
  ];
  assert.equal(pointInRegions({ x: 50, y: 30 }, regions), true);
  assert.equal(pointInRegions({ x: 25, y: 120 }, regions), true);
  assert.equal(pointInRegions({ x: 200, y: 200 }, regions), false);
});

test("uses half-open rectangle edges", () => {
  const regions = [{ x: 0, y: 0, width: 10, height: 10 }];
  assert.equal(pointInRegions({ x: 0, y: 0 }, regions), true);
  assert.equal(pointInRegions({ x: 9.99, y: 9.99 }, regions), true);
  assert.equal(pointInRegions({ x: 10, y: 5 }, regions), false);
});

test("drops invalid regions", () => {
  assert.deepEqual(sanitizeRegions([null, {}, { x: 1, y: 2, width: 3, height: 4 }]), [
    { x: 1, y: 2, width: 3, height: 4 },
  ]);
});
