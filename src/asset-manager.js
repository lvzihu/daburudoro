const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { isCharacterId } = require("./character-catalog");

const AUDIO_EXTENSIONS = new Set([".mp3", ".m4a", ".wav"]);

function managedAssetName(characterId, sourcePath) {
  if (!isCharacterId(characterId)) throw new RangeError("Unknown character.");
  const extension = path.extname(sourcePath).toLowerCase();
  const digest = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
  return `${characterId}-${digest.slice(0, 16)}${extension}`;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

class AssetManager {
  constructor(rootPath) {
    this.rootPath = rootPath;
    this.audioRoot = path.join(rootPath, "audio");
  }

  importAudio(characterId, sourcePath) {
    const extension = path.extname(sourcePath).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(extension)) throw new RangeError("Choose an MP3, M4A, or WAV file.");
    return this.copyManaged(characterId, sourcePath, this.audioRoot);
  }

  copyManaged(characterId, sourcePath, destinationRoot) {
    fs.mkdirSync(destinationRoot, { recursive: true });
    const destination = path.join(destinationRoot, managedAssetName(characterId, sourcePath));
    if (path.resolve(sourcePath) !== path.resolve(destination)) {
      fs.copyFileSync(sourcePath, destination);
    }
    return destination;
  }

  remove(filePath) {
    if (!filePath) return;
    const resolved = path.resolve(filePath);
    const isManaged = isInside(this.audioRoot, resolved);
    if (!isManaged) throw new RangeError("Refusing to remove an unmanaged file.");
    try {
      fs.unlinkSync(resolved);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  isManagedAudio(filePath) {
    return Boolean(filePath) && isInside(this.audioRoot, path.resolve(filePath));
  }
}

module.exports = {
  AssetManager,
  AUDIO_EXTENSIONS,
  isInside,
  managedAssetName,
};
