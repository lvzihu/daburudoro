const timer = new PomodoroTimer(1);
const elements = {
  character: document.querySelector("#character"),
  phase: document.querySelector("#phase"),
  cycle: document.querySelector("#cycle"),
  countdown: document.querySelector("#countdown"),
  cycles: document.querySelector("#cycles"),
  start: document.querySelector("#start"),
  pause: document.querySelector("#pause"),
  reset: document.querySelector("#reset"),
};

let frameIndex = 0;
let isPassingMouseThrough = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function animationState(state) {
  return state.phase === "break" ? "break" : "working";
}

function render(state) {
  const labels = { idle: "Ready", focus: "Focus", break: "Break", complete: "Done" };
  elements.phase.textContent = labels[state.phase];
  elements.cycle.textContent = `Cycle ${state.currentCycle} / ${state.totalCycles}`;
  elements.countdown.textContent = formatTime(state.secondsRemaining);
  elements.pause.textContent = state.isRunning ? "Pause" : "Resume";
  elements.pause.disabled = state.phase === "idle" || state.isComplete;
  elements.start.disabled = state.isRunning;
  elements.cycles.disabled = state.phase !== "idle";

  const frames = window.paramodo.frames[animationState(state)];
  if (frames.length) elements.character.src = frames[frameIndex % frames.length];
}

elements.start.addEventListener("click", () => {
  const cycles = Number(elements.cycles.value);
  if (!Number.isInteger(cycles) || cycles < 1) {
    elements.cycles.reportValidity();
    return;
  }
  if (timer.phase === "idle" || timer.isComplete) timer.reset(cycles);
  render(timer.start());
});

elements.pause.addEventListener("click", () => render(timer.togglePause()));
elements.reset.addEventListener("click", () => render(timer.reset(Number(elements.cycles.value) || 1)));

document.addEventListener("mousemove", (event) => {
  const isInteractive = Boolean(event.target.closest?.(".panel, .drag-handle"));
  const shouldPassThrough = !isInteractive;
  if (shouldPassThrough === isPassingMouseThrough) return;
  isPassingMouseThrough = shouldPassThrough;
  window.paramodo.setMousePassthrough(shouldPassThrough);
});

setInterval(() => render(timer.tick()), 1000);
setInterval(() => {
  if (!timer.isRunning) return;
  frameIndex += 1;
  render(timer.snapshot());
}, 400);

render(timer.snapshot());
