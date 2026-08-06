const test = require("node:test");
const assert = require("node:assert/strict");
const { CharacterSession } = require("../src/character-session");

test("selects immediately while ready", () => {
  const session = new CharacterSession("yellow");
  assert.deepEqual(session.select("blue", "idle"), {
    activeCharacterId: "blue",
    nextCharacterId: null,
  });
});

test("queues a selection during break without replacing the outgoing character", () => {
  const session = new CharacterSession("yellow");
  assert.deepEqual(session.select("blue", "break"), {
    activeCharacterId: "yellow",
    nextCharacterId: "blue",
  });
  assert.deepEqual(session.enterFocus(), {
    activeCharacterId: "blue",
    nextCharacterId: null,
  });
});

test("ignores selection during focus and clears queued selection on reset", () => {
  const session = new CharacterSession("yellow");
  session.select("blue", "break");
  assert.equal(session.select("red", "focus").activeCharacterId, "yellow");
  assert.deepEqual(session.reset(), {
    activeCharacterId: "yellow",
    nextCharacterId: null,
  });
});

test("selects immediately after completion", () => {
  const session = new CharacterSession("yellow");
  assert.deepEqual(session.select("purple", "complete"), {
    activeCharacterId: "purple",
    nextCharacterId: null,
  });
});
