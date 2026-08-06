const FADE_SECONDS = 5;

function normalizedVolume(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0.7;
  return Math.max(0, Math.min(1, numeric));
}

function fadeMultiplier(secondsRemaining, fadeSeconds = FADE_SECONDS) {
  if (!Number.isFinite(secondsRemaining)) return 1;
  if (secondsRemaining <= 0) return 0;
  if (secondsRemaining >= fadeSeconds) return 1;
  return secondsRemaining / fadeSeconds;
}

function playbackVolume(preferredVolume, secondsRemaining) {
  return normalizedVolume(preferredVolume) * fadeMultiplier(secondsRemaining);
}

if (typeof module !== "undefined") {
  module.exports = { FADE_SECONDS, normalizedVolume, fadeMultiplier, playbackVolume };
}
