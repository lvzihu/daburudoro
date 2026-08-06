const CHARACTER_IDS = Object.freeze(["yellow", "blue", "green", "red", "purple"]);

const CHARACTER_CATALOG = Object.freeze({
  yellow: Object.freeze({
    id: "yellow",
    label: "Yellow",
    activity: "Playing games",
  }),
  blue: Object.freeze({
    id: "blue",
    label: "Blue",
    activity: "Fishing",
  }),
  green: Object.freeze({
    id: "green",
    label: "Green",
    activity: "Hosting radio",
  }),
  red: Object.freeze({
    id: "red",
    label: "Red",
    activity: "Reading books",
  }),
  purple: Object.freeze({
    id: "purple",
    label: "Purple",
    activity: "Directing a movie",
  }),
});

function isCharacterId(value) {
  return typeof value === "string" && CHARACTER_IDS.includes(value);
}

if (typeof module !== "undefined") {
  module.exports = { CHARACTER_IDS, CHARACTER_CATALOG, isCharacterId };
}
