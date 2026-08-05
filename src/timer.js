const FOCUS_SECONDS = 35 * 60;
const BREAK_SECONDS = 5 * 60;

class PomodoroTimer {
  constructor(cycles = 1) {
    this.reset(cycles);
  }

  reset(cycles = this.totalCycles) {
    if (!Number.isInteger(cycles) || cycles < 1) {
      throw new RangeError("Cycles must be a positive integer.");
    }

    this.totalCycles = cycles;
    this.currentCycle = 1;
    this.phase = "idle";
    this.secondsRemaining = FOCUS_SECONDS;
    this.isRunning = false;
    this.isComplete = false;
    return this.snapshot();
  }

  start() {
    if (this.isComplete) this.reset(this.totalCycles);
    if (this.phase === "idle") this.phase = "focus";
    this.isRunning = true;
    return this.snapshot();
  }

  togglePause() {
    if (this.phase === "idle" || this.isComplete) return this.snapshot();
    this.isRunning = !this.isRunning;
    return this.snapshot();
  }

  tick() {
    if (!this.isRunning) return this.snapshot();
    this.secondsRemaining -= 1;

    if (this.secondsRemaining <= 0) this.advancePhase();
    return this.snapshot();
  }

  advancePhase() {
    if (this.phase === "focus" && this.currentCycle === this.totalCycles) {
      this.phase = "complete";
      this.secondsRemaining = 0;
      this.isRunning = false;
      this.isComplete = true;
      return;
    }

    if (this.phase === "focus") {
      this.phase = "break";
      this.secondsRemaining = BREAK_SECONDS;
      return;
    }

    this.currentCycle += 1;
    this.phase = "focus";
    this.secondsRemaining = FOCUS_SECONDS;
  }

  snapshot() {
    return {
      totalCycles: this.totalCycles,
      currentCycle: this.currentCycle,
      phase: this.phase,
      secondsRemaining: this.secondsRemaining,
      isRunning: this.isRunning,
      isComplete: this.isComplete,
    };
  }
}

if (typeof module !== "undefined") {
  module.exports = { PomodoroTimer, FOCUS_SECONDS, BREAK_SECONDS };
}
