const elements = {
  widget: document.querySelector("#widget"),
  companionSurface: document.querySelector("#companion-surface"),
  characterSprite: document.querySelector("#character-sprite"),
  character: document.querySelector("#character"),
  hideFloating: document.querySelector("#hide-floating"),
  characterMenuToggle: document.querySelector("#character-menu-toggle"),
  characterMenuClose: document.querySelector("#character-menu-close"),
  characterPopover: document.querySelector("#character-popover"),
  characterOptions: document.querySelector("#character-options"),
  characterSelectionLabel: document.querySelector("#character-selection-label"),
  characterName: document.querySelector("#character-name"),
  characterActivity: document.querySelector("#character-activity"),
  chooseMusic: document.querySelector("#choose-music"),
  removeMusic: document.querySelector("#remove-music"),
  musicFile: document.querySelector("#music-file"),
  musicVolume: document.querySelector("#music-volume"),
  musicVolumeOutput: document.querySelector("#music-volume-output"),
  chooseArtwork: document.querySelector("#choose-artwork"),
  removeArtwork: document.querySelector("#remove-artwork"),
  artworkStatus: document.querySelector("#artwork-status"),
  assetError: document.querySelector("#asset-error"),
  progressHandle: document.querySelector("#progress-handle"),
  progressToggle: document.querySelector("#progress-toggle"),
  progressChevron: document.querySelector("#progress-chevron"),
  progressFill: document.querySelector("#progress-fill"),
  progressLabel: document.querySelector("#progress-label"),
  panel: document.querySelector("#panel"),
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

const CHARACTER_COLORS = {
  yellow: "#e3b52f",
  blue: "#4d8ec9",
  green: "#65a873",
  red: "#d66055",
  purple: "#9171b5",
};

let preferences;
let managedAssets = { artwork: {}, music: {} };
let timer;
let characterSession;
let settingsCharacterId = "yellow";
let frameIndex = 0;
let completeFramesRemaining = 0;
let audioContext;
let lastReportedSessionActive;
let breakAudioToken = 0;
const breakAudio = new Audio();

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
  const labels = { focusMinutes: "Focus", breakMinutes: "Break", totalCycles: "Cycles" };
  for (const [field, value] of Object.entries(config)) {
    if (!Number.isInteger(value) || value < 1) {
      elements.validation.textContent = `${labels[field]} must be a positive whole number.`;
      return null;
    }
  }
  elements.validation.textContent = "";
  return config;
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

function stopBreakMusic() {
  breakAudioToken += 1;
  breakAudio.pause();
  breakAudio.removeAttribute("src");
  breakAudio.load();
}

function startBreakMusic(characterId) {
  stopBreakMusic();
  const asset = managedAssets.music[characterId];
  if (!asset?.url || preferences.musicVolume <= 0) return;
  const token = breakAudioToken;
  setTimeout(async () => {
    if (token !== breakAudioToken || timer.phase !== "break") return;
    try {
      breakAudio.src = asset.url;
      breakAudio.loop = false;
      breakAudio.volume = normalizedVolume(preferences.musicVolume);
      await breakAudio.play();
    } catch (_error) {
      elements.assetError.textContent = "This music file could not be played.";
    }
  }, 500);
}

function updateBreakMusic(state) {
  if (state.phase !== "break" || !breakAudio.src) return;
  const preciseSecondsRemaining =
    state.isRunning && state.phaseEndsAt
      ? Math.max(0, (state.phaseEndsAt - Date.now()) / 1000)
      : state.secondsRemaining;
  breakAudio.volume = playbackVolume(preferences.musicVolume, preciseSecondsRemaining);
}

function transitionMessage(transition, state) {
  if (transition.type === "complete") return "Session complete — nice work.";
  if (transition.phase === "focus") {
    return `Focus started — ${state.config.focusMinutes} minutes.`;
  }
  return `Break started — ${state.config.breakMinutes} minutes.`;
}

async function persistCharacterSession() {
  const snapshot = characterSession.snapshot();
  preferences = await window.daburuDoro.savePreferences({
    characterId: snapshot.activeCharacterId,
    nextCharacterId: snapshot.nextCharacterId,
  });
}

function handleTransitions(state) {
  if (!state.transitions.length) return;
  frameIndex = 0;

  for (const transition of state.transitions) {
    if (transition.phase === "focus") characterSession.enterFocus();
  }
  persistCharacterSession();

  const relevantTransition = state.transitions.at(-1);
  if (relevantTransition.type === "complete") {
    stopBreakMusic();
    completeFramesRemaining =
      window.daburuDoro.frames[characterSession.activeCharacterId]?.sheet
        ? 2
        : window.daburuDoro.frames[characterSession.activeCharacterId]?.complete.length || 0;
  } else if (relevantTransition.phase === "break") {
    startBreakMusic(characterSession.activeCharacterId);
  } else if (relevantTransition.phase === "focus") {
    stopBreakMusic();
  }

  window.daburuDoro.showNotification(transitionMessage(relevantTransition, state));
  playChime();
}

function characterFrames(characterId, stateName) {
  const characterAssets = window.daburuDoro.frames[characterId] || {};
  const preferred = characterAssets[stateName] || [];
  if (preferred.length) return preferred;
  const fallback = window.daburuDoro.frames.yellow || {};
  return fallback[stateName]?.length ? fallback[stateName] : fallback.ready || [];
}

function renderCharacter(state) {
  const id = characterSession.activeCharacterId;
  const customImage = managedAssets.artwork[id];
  const assets = window.daburuDoro.frames[id] || {};
  elements.characterSprite.classList.add("is-hidden");
  elements.character.classList.remove("is-hidden");

  if (customImage && state.phase !== "break") {
    elements.character.src = customImage;
    return;
  }

  if (assets.sheet) {
    elements.character.classList.add("is-hidden");
    elements.characterSprite.classList.remove("is-hidden");
    elements.characterSprite.style.backgroundImage = `url("${assets.sheet}")`;

    if (state.phase === "focus") {
      elements.characterSprite.style.backgroundPosition = "";
      return;
    }

    if (state.phase === "break") {
      elements.characterSprite.style.backgroundPosition = "0% 100%";
      return;
    }

    elements.characterSprite.style.backgroundPosition = "0% 0%";
    if (state.phase === "complete" && completeFramesRemaining > 0) {
      elements.characterSprite.style.backgroundPosition = "50% 100%";
    }
    return;
  }

  if (state.phase === "focus") {
    const frames = characterFrames(id, "focus");
    if (frames[0]) elements.character.src = frames[0];
    return;
  }

  if (state.phase === "break") {
    const frames = characterFrames(id, "sleep");
    if (frames[0]) elements.character.src = frames[0];
    return;
  }

  const readyFrames = characterFrames(id, "ready");
  if (readyFrames[0]) elements.character.src = readyFrames[0];
  if (state.phase === "complete" && completeFramesRemaining > 0) {
    const completeFrames = characterFrames(id, "complete");
    if (completeFrames[0]) elements.character.src = completeFrames[0];
  }
}

function setExpanded(expanded, persist = true) {
  preferences.expanded = expanded;
  elements.widget.classList.toggle("is-collapsed", !expanded);
  elements.progressToggle.setAttribute("aria-expanded", String(expanded));
  elements.progressToggle.title = expanded ? "Hide timer controls" : "Show timer controls";
  elements.progressChevron.textContent = expanded ? "⌃" : "⌄";
  if (persist) window.daburuDoro.savePreferences({ expanded });
  scheduleInteractionRegions();
}

function setCharacterPopover(open) {
  elements.characterPopover.hidden = !open;
  elements.characterMenuToggle.setAttribute("aria-expanded", String(open));
  if (open) {
    const snapshot = characterSession.snapshot();
    settingsCharacterId = snapshot.nextCharacterId || snapshot.activeCharacterId;
    renderCharacterPicker(timer.snapshot());
  }
  scheduleInteractionRegions();
}

function renderCharacterPicker(state) {
  const snapshot = characterSession.snapshot();
  elements.characterOptions.replaceChildren();

  for (const id of window.daburuDoro.characterIds) {
    const character = window.daburuDoro.characters[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-option";
    button.dataset.characterId = id;
    button.classList.toggle("is-selected", snapshot.activeCharacterId === id);
    button.classList.toggle("is-next", snapshot.nextCharacterId === id);
    button.setAttribute("aria-label", `${character.label}: ${character.activity}`);

    const swatch = document.createElement("span");
    swatch.className = "character-swatch";
    swatch.style.background = CHARACTER_COLORS[id];
    const label = document.createElement("small");
    label.textContent = character.label;
    button.append(swatch, label);
    button.addEventListener("click", () => selectCharacter(id));
    elements.characterOptions.append(button);
  }

  const settingsCharacter = window.daburuDoro.characters[settingsCharacterId];
  elements.characterName.textContent = settingsCharacter.label;
  elements.characterActivity.textContent = settingsCharacter.activity;
  elements.characterSelectionLabel.textContent = snapshot.nextCharacterId
    ? `Next: ${window.daburuDoro.characters[snapshot.nextCharacterId].label}`
    : `Selected: ${window.daburuDoro.characters[snapshot.activeCharacterId].label}`;

  const music = managedAssets.music[settingsCharacterId];
  const artwork = managedAssets.artwork[settingsCharacterId];
  elements.musicFile.textContent = music ? "Break music assigned" : "No Break music assigned";
  elements.removeMusic.disabled = !music;
  elements.artworkStatus.textContent = artwork ? "Using a private custom image" : "Using preset artwork";
  elements.removeArtwork.disabled = !artwork;
  elements.musicVolume.value = String(Math.round(preferences.musicVolume * 100));
  elements.musicVolumeOutput.textContent = `${Math.round(preferences.musicVolume * 100)}%`;

  const canSelect = ["idle", "break", "complete"].includes(state.phase);
  for (const option of elements.characterOptions.children) option.disabled = !canSelect;
}

async function selectCharacter(characterId) {
  if (!["idle", "break", "complete"].includes(timer.phase)) return;
  characterSession.select(characterId, timer.phase);
  if (timer.phase === "complete") completeFramesRemaining = 0;
  settingsCharacterId = characterId;
  await persistCharacterSession();
  render(timer.snapshot());
}

function render(state) {
  const labels = { idle: "Ready", focus: "Focus", break: "Break", complete: "Done" };
  const isActive = state.phase === "focus" || state.phase === "break";
  const fieldsLocked = isActive || state.isPaused;
  const label = labels[state.phase];

  elements.widget.dataset.phase = state.phase;
  elements.widget.dataset.character = characterSession.activeCharacterId;
  elements.widget.classList.toggle("is-paused", state.isPaused);
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

  renderCharacter(state);
  const activeCharacter = window.daburuDoro.characters[characterSession.activeCharacterId];
  elements.character.alt = `${activeCharacter.label} companion — ${activeCharacter.activity}`;
  updateBreakMusic(state);
  if (!elements.characterPopover.hidden) renderCharacterPicker(state);
  scheduleInteractionRegions();
}

async function saveValidInputs() {
  const config = validateInputs();
  if (!config) return null;
  preferences = await window.daburuDoro.savePreferences(config);
  return config;
}

async function startSession() {
  ensureAudioContext();
  stopBreakMusic();
  const config = await saveValidInputs();
  if (!config) return;
  characterSession.reset();
  await persistCharacterSession();
  timer.reset(config);
  const state = timer.start();
  handleTransitions(state);
  render(state);
  setCharacterPopover(false);
  setExpanded(false);
}

async function resetSession(requireConfirmation = true) {
  if (requireConfirmation && timer.phase !== "idle") {
    const confirmed = await window.daburuDoro.confirmReset();
    if (!confirmed) return;
  }
  stopBreakMusic();
  characterSession.reset();
  await persistCharacterSession();
  frameIndex = 0;
  completeFramesRemaining = 0;
  render(timer.reset(currentInputConfig()));
}

async function updateManagedAsset(action) {
  elements.assetError.textContent = "";
  try {
    managedAssets = await action(settingsCharacterId);
    render(timer.snapshot());
  } catch (error) {
    elements.assetError.textContent = error.message || "The selected file could not be imported.";
  }
}

function rectFor(element) {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

let interactionRegionFrame;
function scheduleInteractionRegions() {
  cancelAnimationFrame(interactionRegionFrame);
  interactionRegionFrame = requestAnimationFrame(() => {
    const regions = [rectFor(elements.companionSurface), rectFor(elements.progressHandle)];
    if (!elements.widget.classList.contains("is-collapsed")) {
      regions.push(rectFor(elements.panel));
    }
    window.daburuDoro.updateInteractionRegions(regions);
  });
}

elements.progressToggle.addEventListener("click", () => setExpanded(!preferences.expanded));
elements.collapse.addEventListener("click", () => setExpanded(false));
elements.hideFloating.addEventListener("click", () => window.daburuDoro.hideWidget());
elements.hide.addEventListener("click", () => window.daburuDoro.hideWidget());
elements.characterMenuToggle.addEventListener("click", () =>
  setCharacterPopover(elements.characterPopover.hidden),
);
elements.characterMenuClose.addEventListener("click", () => setCharacterPopover(false));
elements.start.addEventListener("click", startSession);
elements.pause.addEventListener("click", () => {
  const state = timer.togglePause();
  if (state.phase === "break") {
    if (state.isPaused) breakAudio.pause();
    if (state.isRunning && breakAudio.src && !breakAudio.ended) breakAudio.play().catch(() => {});
  }
  handleTransitions(state);
  render(state);
});
elements.reset.addEventListener("click", () => resetSession(true));

for (const input of [elements.focusMinutes, elements.breakMinutes, elements.cycles]) {
  input.addEventListener("input", validateInputs);
  input.addEventListener("change", saveValidInputs);
}

elements.sound.addEventListener("change", async () => {
  preferences.soundEnabled = elements.sound.checked;
  preferences = await window.daburuDoro.savePreferences({ soundEnabled: preferences.soundEnabled });
  if (preferences.soundEnabled) playChime();
});

elements.musicVolume.addEventListener("input", () => {
  preferences.musicVolume = Number(elements.musicVolume.value) / 100;
  elements.musicVolumeOutput.textContent = `${elements.musicVolume.value}%`;
  updateBreakMusic(timer.snapshot());
});
elements.musicVolume.addEventListener("change", async () => {
  preferences = await window.daburuDoro.savePreferences({
    musicVolume: Number(elements.musicVolume.value) / 100,
  });
});

elements.chooseMusic.addEventListener("click", () => updateManagedAsset(window.daburuDoro.importMusic));
elements.removeMusic.addEventListener("click", () => updateManagedAsset(window.daburuDoro.removeMusic));
elements.chooseArtwork.addEventListener("click", () => updateManagedAsset(window.daburuDoro.importArtwork));
elements.removeArtwork.addEventListener("click", () => updateManagedAsset(window.daburuDoro.removeArtwork));

elements.defaults.addEventListener("click", async () => {
  preferences = await window.daburuDoro.resetDefaults();
  elements.focusMinutes.value = preferences.focusMinutes;
  elements.breakMinutes.value = preferences.breakMinutes;
  elements.cycles.value = preferences.totalCycles;
  elements.sound.checked = preferences.soundEnabled;
  render(timer.reset(currentInputConfig()));
});

window.daburuDoro.onAppAction((action) => {
  if (action === "collapse-controls") {
    setExpanded(false);
    setCharacterPopover(false);
  }
  if (action === "restart-session") {
    stopBreakMusic();
    characterSession.reset();
    persistCharacterSession();
    timer.reset(currentInputConfig());
    const state = timer.start();
    handleTransitions(state);
    render(state);
    setCharacterPopover(false);
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
  if (timer.phase === "complete") {
    if (completeFramesRemaining > 0) {
      completeFramesRemaining -= 1;
      frameIndex += 1;
      render(timer.snapshot());
    }
    return;
  }
  if (timer.phase !== "focus") return;
  frameIndex += 1;
  render(timer.snapshot());
}, 400);

window.addEventListener("resize", scheduleInteractionRegions);
new ResizeObserver(scheduleInteractionRegions).observe(elements.widget);

async function initialize() {
  preferences = await window.daburuDoro.getPreferences();
  managedAssets = await window.daburuDoro.getManagedAssets();
  elements.focusMinutes.value = preferences.focusMinutes;
  elements.breakMinutes.value = preferences.breakMinutes;
  elements.cycles.value = preferences.totalCycles;
  elements.sound.checked = preferences.soundEnabled;
  elements.musicVolume.value = String(Math.round(preferences.musicVolume * 100));
  elements.musicVolumeOutput.textContent = `${Math.round(preferences.musicVolume * 100)}%`;
  timer = new PomodoroTimer({
    focusMinutes: preferences.focusMinutes,
    breakMinutes: preferences.breakMinutes,
    totalCycles: preferences.totalCycles,
  });
  characterSession = new CharacterSession(preferences.characterId);
  if (preferences.nextCharacterId) {
    preferences = await window.daburuDoro.savePreferences({ nextCharacterId: null });
  }
  settingsCharacterId = preferences.characterId;
  setExpanded(preferences.expanded, false);
  render(timer.snapshot());
}

initialize();
