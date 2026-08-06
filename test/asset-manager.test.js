const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { AssetManager, isInside } = require("../src/asset-manager");

function fixtureDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "daburudoro-assets-"));
}

test("copies supported images and audio into managed character storage", () => {
  const directory = fixtureDirectory();
  const sourceImage = path.join(directory, "cat.png");
  const sourceAudio = path.join(directory, "song.mp3");
  fs.writeFileSync(sourceImage, "image bytes");
  fs.writeFileSync(sourceAudio, "audio bytes");
  const manager = new AssetManager(path.join(directory, "managed"), {
    validateImage: () => true,
  });

  const image = manager.importImage("yellow", sourceImage);
  const audio = manager.importAudio("yellow", sourceAudio);
  assert.equal(manager.isManagedImage(image), true);
  assert.equal(manager.isManagedAudio(audio), true);
  assert.equal(fs.readFileSync(image, "utf8"), "image bytes");
  assert.equal(fs.readFileSync(audio, "utf8"), "audio bytes");
});

test("rejects unsupported types, characters, and unmanaged removal", () => {
  const directory = fixtureDirectory();
  const executable = path.join(directory, "bad.exe");
  fs.writeFileSync(executable, "not allowed");
  const manager = new AssetManager(path.join(directory, "managed"), {
    validateImage: () => true,
  });

  assert.throws(() => manager.importImage("yellow", executable), RangeError);
  assert.throws(() => manager.importAudio("orange", executable), RangeError);
  assert.throws(() => manager.remove(executable), RangeError);
});

test("removes only managed files and detects path boundaries", () => {
  const directory = fixtureDirectory();
  const source = path.join(directory, "song.wav");
  fs.writeFileSync(source, "audio");
  const manager = new AssetManager(path.join(directory, "managed"), {
    validateImage: () => true,
  });
  const managed = manager.importAudio("blue", source);
  manager.remove(managed);
  assert.equal(fs.existsSync(managed), false);
  assert.equal(isInside(manager.audioRoot, path.join(manager.audioRoot, "blue.wav")), true);
  assert.equal(isInside(manager.audioRoot, path.join(directory, "outside.wav")), false);
});

test("re-importing the same managed file is a safe no-op", () => {
  const directory = fixtureDirectory();
  const source = path.join(directory, "song.mp3");
  fs.writeFileSync(source, "same audio");
  const manager = new AssetManager(path.join(directory, "managed"), {
    validateImage: () => true,
  });
  const managed = manager.importAudio("green", source);
  assert.equal(manager.copyManaged("green", managed, manager.audioRoot), managed);
  assert.equal(fs.readFileSync(managed, "utf8"), "same audio");
});
