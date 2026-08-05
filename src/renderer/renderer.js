const elements = {
  widget: document.querySelector("#widget"),
  character: document.querySelector("#character"),
  progressToggle: document.querySelector("#progress-toggle"),
  progressFill: document.querySelector("#progress-fill"),
  progressLabel: document.querySelector("#progress-label"),
  phase: document.querySelector("#phase"),
  cycle: document.querySelector("#cycle"),
  countdown: document.querySelector("#countdown"),
  focusMinutes: document.querySelector("#focus-minutes"),
  breakMinutes: document.querySelector("#break-minutes"),
  cycles: document.querySelector("#cycles"),
  validation: document.querySelector("#validation"),
  start: document.querySelector("#start"),
  pause: document.querySelector("#pause"),
  reset: document.querySelector("#reset"),
  hide: document.querySelector("#hide"),
  sound: document.querySelector("#sound"),
  defaults: document.querySelector("#defaults"),
  collapse: document.querySelector("#collapse"),
};

let preferences;
let timer;
let frameIndex = 0;
let isPassingMouseThrough = false;
let audioContext;
let lastReportedSessionActive;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function currentInputConfig() {
  return {
    focusMinutes: Number(elements.focusMinutes.value),
    breakMinutes: Number(elements.breakMinutes.value),
    totalCycles: Number(elements.cycles.value),
  };
}

function validateInputs() {
  const config = currentInputConfig();
  const labels = {
    focusMinutes: "Focus",
    breakMinutes: "Break",
    totalCycles: "Cycles",
  };

  for (const [field, value] of Object.entries(config)) {
    if (!Number.isInteger(value) || value < 1) {
      elements.validation.textContent = `${labels[field]} must be a positive whole number.`;
      return null;
    }
  }

  elements.validation.textContent = "";
  return config;
}

function animationState(state) {
  if (state.phase === "focus") return "working";
  if (state.phase === "break") return "break";
  return "idle";
}

function setExpanded(expanded, persist = true) {
  preferences.expanded = expanded;
  elements.widget.classList.toggle("is-collapsed", !expanded);
  elements.progressToggle.setAttribute("aria-expanded", String(expanded));
  elements.progressToggle.title = expanded ? "Hide timer controls" : "Show timer controls";
  if (persist) window.daburuDoro.savePreferences({ expanded });
}

function render(state) {
  const labels = { idle: "Ready", focus: "Focus", break: "Break", complete: "Done" };
  const isActive = state.phase === "focus" || state.phase === "break";
  const fieldsLocked = isActive || state.isPaused;
  const label = labels[state.phase];

  elements.widget.dataset.phase = state.phase;
  elements.phase.textContent = label;
  elements.cycle.textContent = `Cycle ${state.currentCycle} / ${state.totalCycles}`;
  elements.countdown.textContent = formatTime(state.secondsRemaining);
  elements.progressLabel.textContent = `${label}, ${formatTime(state.secondsRemaining)} remaining`;
  const remainingRatio =
    state.phaseTotalSeconds > 0 ? state.secondsRemaining / state.phaseTotalSeconds : 0;
  elements.progressFill.style.width = `${Math.max(0, Math.min(1, remainingRatio)) * 100}%`;

  elements.focusMinutes.disabled = fieldsLocked;
  elements.breakMinutes.disabled = fieldsLocked;
  elements.cycles.disabled = fieldsLocked;
  elements.defaults.disabled = fieldsLocked;
  elements.start.disabled = fieldsLocked;
  elements.start.textContent = state.isComplete ? "Start Again" : "Start";
  elements.pause.disabled = !isActive && !state.isPaused;
  elements.pause.textContent = state.isRunning ? "Pause" : "Resume";
  elements.reset.disabled = state.phase === "idle";
  const sessionActive = isActive || state.isPaused;
  if (sessionActive !== lastReportedSessionActive) {
    lastReportedSessionActive = sessionActive;
    window.daburuDoro.setSessionActive(sessionActive);
  }

  const frameState = animationState(state);
  const frames = window.daburuDoro.frames[frameState];
  const fallbackFrames = window.daburuDoro.frames.working;
  const availableFrames = frames.length ? frames : fallbackFrames;
  if (availableFrames.length) {
    elements.character.src = availableFrames[frameIndex % availableFrames.length];
  }
}

function ensureAudioContext() {
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") audioContext.resume();
}

function playChime() {
  if (!preferences.soundEnabled) return;
  ensureAudioContext();
  const startedAt = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(660, startedAt);
  oscillator.frequency.setValueAtTime(880, startedAt + 0.12);
  gain.gain.setValueAtTime(0.0001, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.16, startedAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.42);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + 0.44);
}

function transitionMessage(transition, state) {
  if (transition.type === "complete") return "Session complete — nice work.";
  if (transition.phase === "focus") {
    return `Focus started — ${state.config.focusMinutes} minutes.`;
  }
  return `Break started — ${state.config.breakMinutes} minutes.`;
}

function handleTransitions(state) {
  if (!state.transitions.length) return;
  const relevantTransition = state.transitions.at(-1);
  const message = transitionMessage(relevantTransition, state);
  window.daburuDoro.showNotification(message);
  playChime();
}

async function saveValidInputs() {
  const config = validateInputs();
  if (!config) return null;
  preferences = await window.daburuDoro.savePreferences(config);
  return config;
}

async function startSession() {
  ensureAudioContext();
  const config = await saveValidInputs();
  if (!config) return;
  timer.reset(config);
  const state = timer.start();
  handleTransitions(state);
  render(state);
  setExpanded(false);
}

async function resetSession(requireConfirmation = true) {
  if (requireConfirmation && timer.phase !== "idle") {
    const confirmed = await window.daburuDoro.confirmReset();
    if (!confirmed) return;
  }
  frameIndex = 0;
  render(timer.reset(currentInputConfig()));
}

elements.progressToggle.addEventListener("click", () => setExpanded(!preferences.expanded));
elements.collapse.addEventListener("click", () => setExpanded(false));
elements.start.addEventListener("click", startSession);
elements.pause.addEventListener("click", () => {
  const state = timer.togglePause();
  handleTransitions(state);
  render(state);
});
elements.reset.addEventListener("click", () => resetSession(true));
elements.hide.addEventListener("click", () => window.daburuDoro.hideWidget());

for (const input of [elements.focusMinutes, elements.breakMinutes, elements.cycles]) {
  input.addEventListener("input", validateInputs);
  input.addEventListener("change", saveValidInputs);
}

elements.sound.addEventListener("change", async () => {
  preferences.soundEnabled = elements.sound.checked;
  preferences = await window.daburuDoro.savePreferences({
    soundEnabled: preferences.soundEnabled,
  });
  if (preferences.soundEnabled) playChime();
});

elements.defaults.addEventListener("click", async () => {
  preferences = await window.daburuDoro.resetDefaults();
  elements.focusMinutes.value = preferences.focusMinutes;
  elements.breakMinutes.value = preferences.breakMinutes;
  elements.cycles.value = preferences.totalCycles;
  elements.sound.checked = preferences.soundEnabled;
  render(timer.reset(currentInputConfig()));
});

document.addEventListener("mousemove", (event) => {
  const isInteractive = Boolean(
    event.target.closest?.(".companion-surface, .progress-toggle, .panel"),
  );
  const shouldPassThrough = !isInteractive;
  if (shouldPassThrough === isPassingMouseThrough) return;
  isPassingMouseThrough = shouldPassThrough;
  window.daburuDoro.setMousePassthrough(shouldPassThrough);
});

window.daburuDoro.onAppAction((action) => {
  if (action === "collapse-controls") setExpanded(false);
  if (action === "restart-session") {
    timer.reset(currentInputConfig());
    const state = timer.start();
    handleTransitions(state);
    render(state);
    setExpanded(false);
  }
});

setInterval(() => {
  if (!timer) return;
  const state = timer.tick();
  handleTransitions(state);
  render(state);
}, 250);

setInterval(() => {
  if (!timer || timer.isPaused) return;
  frameIndex += 1;
  render(timer.snapshot());
}, 400);

async function initialize() {
  preferences = await window.daburuDoro.getPreferences();
  elements.focusMinutes.value = preferences.focusMinutes;
  elements.breakMinutes.value = preferences.breakMinutes;
  elements.cycles.value = preferences.totalCycles;
  elements.sound.checked = preferences.soundEnabled;
  timer = new PomodoroTimer({
    focusMinutes: preferences.focusMinutes,
    breakMinutes: preferences.breakMinutes,
    totalCycles: preferences.totalCycles,
  });
  setExpanded(preferences.expanded, false);
  render(timer.snapshot());
}

initialize();
