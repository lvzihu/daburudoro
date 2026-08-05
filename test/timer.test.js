const test = require("node:test");
const assert = require("node:assert/strict");
const { PomodoroTimer, FOCUS_SECONDS, BREAK_SECONDS } = require("../src/timer");

test("starts in focus and counts down", () => {
  const timer = new PomodoroTimer(2);
  timer.start();
  assert.equal(timer.phase, "focus");
  assert.equal(timer.tick().secondsRemaining, FOCUS_SECONDS - 1);
});

test("pause prevents countdown and resume continues", () => {
  const timer = new PomodoroTimer(1);
  timer.start();
  timer.tick();
  timer.togglePause();
  assert.equal(timer.tick().secondsRemaining, FOCUS_SECONDS - 1);
  timer.togglePause();
  assert.equal(timer.tick().secondsRemaining, FOCUS_SECONDS - 2);
});

test("moves from focus to break and then the next cycle", () => {
  const timer = new PomodoroTimer(2);
  timer.start();
  timer.secondsRemaining = 1;
  assert.equal(timer.tick().phase, "break");
  assert.equal(timer.secondsRemaining, BREAK_SECONDS);
  timer.secondsRemaining = 1;
  timer.tick();
  assert.equal(timer.phase, "focus");
  assert.equal(timer.currentCycle, 2);
});

test("finishes after the final focus without a trailing break", () => {
  const timer = new PomodoroTimer(1);
  timer.start();
  timer.secondsRemaining = 1;
  const state = timer.tick();
  assert.equal(state.phase, "complete");
  assert.equal(state.isRunning, false);
  assert.equal(state.secondsRemaining, 0);
});

test("rejects invalid cycle counts", () => {
  assert.throws(() => new PomodoroTimer(0), RangeError);
  assert.throws(() => new PomodoroTimer(1.5), RangeError);
});
