const test = require("node:test");
const assert = require("node:assert/strict");
const { PomodoroTimer, DEFAULT_CONFIG, validateConfig } = require("../src/timer");

function createClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance(seconds) {
      current += seconds * 1000;
      return current;
    },
  };
}

test("uses the documented defaults", () => {
  const timer = new PomodoroTimer();
  assert.deepEqual(timer.config, DEFAULT_CONFIG);
  assert.equal(timer.secondsRemaining, 35 * 60);
});

test("supports custom whole-minute durations and cycles", () => {
  const timer = new PomodoroTimer({ focusMinutes: 50, breakMinutes: 10, totalCycles: 3 });
  assert.equal(timer.secondsRemaining, 50 * 60);
  assert.equal(timer.totalCycles, 3);
});

test("rejects blank, zero, negative, decimal, and non-numeric values", () => {
  const valid = { focusMinutes: 35, breakMinutes: 5, totalCycles: 1 };
  for (const badValue of ["", 0, -1, 1.5, "nope"]) {
    assert.throws(() => validateConfig({ ...valid, focusMinutes: badValue }), RangeError);
  }
});

test("every cycle includes its break, including the final cycle", () => {
  const clock = createClock();
  const timer = new PomodoroTimer(
    { focusMinutes: 1, breakMinutes: 1, totalCycles: 1 },
    clock.now,
  );

  timer.start();
  let state = timer.tick(clock.advance(60));
  assert.equal(state.phase, "break");
  assert.equal(state.secondsRemaining, 60);
  assert.deepEqual(state.transitions, [{ type: "phase", phase: "break" }]);

  state = timer.tick(clock.advance(60));
  assert.equal(state.phase, "complete");
  assert.equal(state.isComplete, true);
  assert.deepEqual(state.transitions, [{ type: "complete", phase: "complete" }]);
});

test("advances through multiple cycles after a stalled interval", () => {
  const clock = createClock();
  const timer = new PomodoroTimer(
    { focusMinutes: 1, breakMinutes: 1, totalCycles: 3 },
    clock.now,
  );

  timer.start();
  const state = timer.tick(clock.advance(4 * 60 + 30));
  assert.equal(state.phase, "focus");
  assert.equal(state.currentCycle, 3);
  assert.equal(state.secondsRemaining, 30);
  assert.equal(state.transitions.length, 4);
});

test("completes correctly when sleep spans the full session", () => {
  const clock = createClock();
  const timer = new PomodoroTimer(
    { focusMinutes: 1, breakMinutes: 1, totalCycles: 2 },
    clock.now,
  );

  timer.start();
  const state = timer.tick(clock.advance(10 * 60));
  assert.equal(state.phase, "complete");
  assert.equal(state.secondsRemaining, 0);
  assert.equal(state.transitions.at(-1).type, "complete");
});

test("pause freezes remaining time and resume creates a new deadline", () => {
  const clock = createClock();
  const timer = new PomodoroTimer(
    { focusMinutes: 1, breakMinutes: 1, totalCycles: 1 },
    clock.now,
  );

  timer.start();
  clock.advance(15);
  let state = timer.pause();
  assert.equal(state.secondsRemaining, 45);
  assert.equal(state.isPaused, true);

  clock.advance(300);
  assert.equal(timer.tick().secondsRemaining, 45);

  state = timer.resume();
  assert.equal(state.phaseEndsAt, clock.now() + 45_000);
  state = timer.tick(clock.advance(10));
  assert.equal(state.secondsRemaining, 35);
});

test("reset returns to idle without changing the selected configuration", () => {
  const config = { focusMinutes: 25, breakMinutes: 7, totalCycles: 4 };
  const timer = new PomodoroTimer(config);
  timer.start(0);
  const state = timer.reset();
  assert.equal(state.phase, "idle");
  assert.deepEqual(state.config, config);
  assert.equal(state.secondsRemaining, 25 * 60);
});
