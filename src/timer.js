const DEFAULT_CONFIG = Object.freeze({
  focusMinutes: 35,
  breakMinutes: 5,
  totalCycles: 1,
});

function validateConfig(config) {
  const normalized = {
    focusMinutes: Number(config.focusMinutes),
    breakMinutes: Number(config.breakMinutes),
    totalCycles: Number(config.totalCycles),
  };

  for (const [field, value] of Object.entries(normalized)) {
    if (!Number.isInteger(value) || value < 1) {
      throw new RangeError(`${field} must be a positive whole number.`);
    }
  }

  return normalized;
}

class PomodoroTimer {
  constructor(config = DEFAULT_CONFIG, now = () => Date.now()) {
    this.now = now;
    this.reset(config);
  }

  reset(config = this.config) {
    this.config = validateConfig(config);
    this.totalCycles = this.config.totalCycles;
    this.currentCycle = 1;
    this.phase = "idle";
    this.secondsRemaining = this.config.focusMinutes * 60;
    this.isRunning = false;
    this.isPaused = false;
    this.isComplete = false;
    this.phaseEndsAt = null;
    return this.snapshot();
  }

  start(now = this.now()) {
    if (this.isComplete) this.reset(this.config);
    if (this.phase === "idle") this.phase = "focus";

    this.isRunning = true;
    this.isPaused = false;
    this.phaseEndsAt = now + this.secondsRemaining * 1000;
    return this.snapshot([{ type: "phase", phase: this.phase }]);
  }

  pause(now = this.now()) {
    if (!this.isRunning) return this.snapshot();
    const state = this.tick(now);
    if (state.isComplete) return state;

    this.isRunning = false;
    this.isPaused = true;
    this.phaseEndsAt = null;
    return this.snapshot(state.transitions);
  }

  resume(now = this.now()) {
    if (!this.isPaused || this.isComplete || this.phase === "idle") {
      return this.snapshot();
    }

    this.isRunning = true;
    this.isPaused = false;
    this.phaseEndsAt = now + this.secondsRemaining * 1000;
    return this.snapshot();
  }

  togglePause(now = this.now()) {
    return this.isRunning ? this.pause(now) : this.resume(now);
  }

  tick(now = this.now()) {
    if (!this.isRunning || this.phaseEndsAt === null) return this.snapshot();

    const transitions = [];
    while (this.isRunning && now >= this.phaseEndsAt) {
      const transitionAt = this.phaseEndsAt;
      this.advancePhase(transitionAt, transitions);
    }

    if (this.isRunning) {
      this.secondsRemaining = Math.max(0, Math.ceil((this.phaseEndsAt - now) / 1000));
    }

    return this.snapshot(transitions);
  }

  advancePhase(transitionAt, transitions) {
    if (this.phase === "focus") {
      this.phase = "break";
      this.secondsRemaining = this.config.breakMinutes * 60;
      this.phaseEndsAt = transitionAt + this.secondsRemaining * 1000;
      transitions.push({ type: "phase", phase: "break" });
      return;
    }

    if (this.phase === "break" && this.currentCycle < this.config.totalCycles) {
      this.currentCycle += 1;
      this.phase = "focus";
      this.secondsRemaining = this.config.focusMinutes * 60;
      this.phaseEndsAt = transitionAt + this.secondsRemaining * 1000;
      transitions.push({ type: "phase", phase: "focus" });
      return;
    }

    this.phase = "complete";
    this.secondsRemaining = 0;
    this.phaseEndsAt = null;
    this.isRunning = false;
    this.isPaused = false;
    this.isComplete = true;
    transitions.push({ type: "complete", phase: "complete" });
  }

  phaseTotalSeconds() {
    if (this.phase === "break") return this.config.breakMinutes * 60;
    if (this.phase === "complete") return 0;
    return this.config.focusMinutes * 60;
  }

  snapshot(transitions = []) {
    const totalSeconds = this.phaseTotalSeconds();
    return {
      config: { ...this.config },
      totalCycles: this.config.totalCycles,
      currentCycle: this.currentCycle,
      phase: this.phase,
      secondsRemaining: this.secondsRemaining,
      phaseTotalSeconds: totalSeconds,
      progress: totalSeconds === 0 ? 1 : 1 - this.secondsRemaining / totalSeconds,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isComplete: this.isComplete,
      phaseEndsAt: this.phaseEndsAt,
      transitions,
    };
  }
}

if (typeof module !== "undefined") {
  module.exports = { PomodoroTimer, DEFAULT_CONFIG, validateConfig };
}
