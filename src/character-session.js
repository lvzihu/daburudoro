const characterIdIsValid =
  typeof require === "function"
    ? require("./character-catalog").isCharacterId
    : (value) => isCharacterId(value);

class CharacterSession {
  constructor(characterId = "yellow") {
    this.activeCharacterId = characterIdIsValid(characterId) ? characterId : "yellow";
    this.nextCharacterId = null;
  }

  select(characterId, phase) {
    if (!characterIdIsValid(characterId)) throw new RangeError("Unknown character.");
    if (phase === "focus") return this.snapshot();

    if (phase === "break") {
      this.nextCharacterId = characterId;
    } else {
      this.activeCharacterId = characterId;
      this.nextCharacterId = null;
    }
    return this.snapshot();
  }

  enterFocus() {
    if (this.nextCharacterId) this.activeCharacterId = this.nextCharacterId;
    this.nextCharacterId = null;
    return this.snapshot();
  }

  reset() {
    this.nextCharacterId = null;
    return this.snapshot();
  }

  snapshot() {
    return {
      activeCharacterId: this.activeCharacterId,
      nextCharacterId: this.nextCharacterId,
    };
  }
}

if (typeof module !== "undefined") module.exports = { CharacterSession };
