#!/usr/bin/env python3
"""Build standalone Focus frames whose non-activity pixels are locked.

Run with the bundled Codex Python runtime (Pillow and NumPy are required):

    python scripts/build-locked-focus-sheets.py

The generated `focus-1.png` and `focus-2.png` files preserve every source sheet.
Each Focus frame B starts as an exact copy of frame A, then receives only a
feathered patch inside the character-specific hand/prop activity region.
"""

from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "characters"
FRAME_SIZE = 512

# Polygons cover only the activity: controller/hands, rod/bobber, mixer hand,
# typing hands, and the director's monitor. Pixels outside cannot change.
ACTIVITY_REGIONS = {
    "yellow": [(145, 310), (370, 310), (370, 415), (145, 415)],
    "blue": [(410, 205), (455, 205), (455, 440), (410, 440)],
    "green": [(255, 315), (390, 315), (390, 425), (255, 425)],
    "red": [(155, 215), (325, 215), (325, 335), (155, 335)],
    "purple": [(405, 275), (455, 275), (455, 330), (405, 330)],
}


def shifted(image: Image.Image, dx: int, dy: int) -> Image.Image:
    result = Image.new("RGBA", image.size, (0, 0, 0, 0))
    result.alpha_composite(image, (dx, dy))
    return result


def region_mask(points: list[tuple[int, int]]) -> Image.Image:
    mask = Image.new("L", (FRAME_SIZE, FRAME_SIZE), 0)
    ImageDraw.Draw(mask).polygon(points, fill=255)
    return mask


def alignment_error(master: np.ndarray, candidate: np.ndarray, stable: np.ndarray) -> float:
    union = stable & ((master[:, :, 3] > 24) | (candidate[:, :, 3] > 24))
    if not np.any(union):
        return float("inf")
    delta = np.abs(master.astype(np.int16) - candidate.astype(np.int16))
    return float(delta[union].mean())


def align_alternate(master: Image.Image, alternate: Image.Image, activity: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    master_pixels = np.asarray(master)
    stable = np.asarray(activity) < 8
    best_error = float("inf")
    best = (0, 0)
    best_image = alternate

    for dy in range(-16, 17):
        for dx in range(-32, 33):
            candidate = shifted(alternate, dx, dy)
            error = alignment_error(master_pixels, np.asarray(candidate), stable)
            if error < best_error:
                best_error = error
                best = (dx, dy)
                best_image = candidate

    return best_image, best


def patched_alternate(master: Image.Image, alternate: Image.Image, activity: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    aligned, offset = align_alternate(master, alternate, activity)
    difference = ImageChops.difference(master, aligned)
    difference_mask = difference.convert("L").point(lambda value: 255 if value > 8 else 0)
    difference_mask = difference_mask.filter(ImageFilter.MaxFilter(5))
    difference_mask = difference_mask.filter(ImageFilter.GaussianBlur(0.8))
    patch_mask = ImageChops.multiply(difference_mask, activity)
    return Image.composite(aligned, master, patch_mask), offset


def blue_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    bobber = master.crop((414, 382, 449, 433))
    draw = ImageDraw.Draw(result)
    draw.rectangle((410, 219, 455, 440), fill=(0, 0, 0, 0))
    draw.line((431, 216, 431, 313), fill=(72, 48, 37, 255), width=2)
    result.alpha_composite(bobber, (414, 300))
    if result.getchannel("A").crop((414, 382, 449, 433)).getbbox() is not None:
        raise RuntimeError("Blue: long-line bobber remained in the short-line frame")
    return result


def green_hand_alternate(master: Image.Image, alternate: Image.Image, activity: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    result, offset = patched_alternate(master, alternate, activity)
    draw = ImageDraw.Draw(result)
    outline = (66, 43, 29, 255)
    skin = (255, 218, 184, 255)
    draw.line((329, 372, 338, 405), fill=outline, width=12)
    draw.line((329, 372, 338, 405), fill=skin, width=7)
    draw.ellipse((333, 399, 343, 410), fill=skin, outline=outline, width=2)
    return result, offset


def red_theme(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGBA")).copy()
    red = pixels[:, :, 0].astype(np.int16)
    green = pixels[:, :, 1].astype(np.int16)
    blue = pixels[:, :, 2].astype(np.int16)
    alpha = pixels[:, :, 3]
    yellow = (
        (alpha > 0)
        & (red > 145)
        & (green > 75)
        & (blue < 145)
        & ((red - blue) > 55)
        & ((green - blue) > 35)
    )
    pixels[yellow, 0] = np.clip(red[yellow] + 10, 0, 255)
    pixels[yellow, 1] = np.clip(green[yellow] * 0.24, 18, 86)
    pixels[yellow, 2] = np.clip(blue[yellow] * 0.32 + 28, 28, 92)
    themed = Image.fromarray(pixels, mode="RGBA")
    canvas = Image.new("RGBA", (FRAME_SIZE, FRAME_SIZE), (0, 0, 0, 0))
    canvas.alpha_composite(themed, ((FRAME_SIZE - themed.width) // 2, (FRAME_SIZE - themed.height) // 2))
    return canvas


def red_computer_frames() -> tuple[Image.Image, Image.Image]:
    source_root = CHARACTER_ROOT / "yellow"
    master = red_theme(Image.open(source_root / "working-1.png"))
    alternate = red_theme(Image.open(source_root / "working-2.png"))
    activity = region_mask(ACTIVITY_REGIONS["red"])
    locked, _offset = patched_alternate(master, alternate, activity)
    return master, locked


def purple_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    draw = ImageDraw.Draw(result)
    draw.ellipse((422, 291, 440, 309), fill=(239, 79, 70, 255), outline=(45, 34, 38, 255), width=3)
    draw.ellipse((427, 296, 435, 304), fill=(255, 190, 118, 255))
    return result


def build_alternate(character_id: str, master: Image.Image, alternate: Image.Image, activity: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    if character_id == "yellow":
        return patched_alternate(master, alternate, activity)
    if character_id == "blue":
        return blue_alternate(master), (0, 0)
    if character_id == "green":
        return green_hand_alternate(master, alternate, activity)
    if character_id == "purple":
        return purple_alternate(master), (0, 0)
    return patched_alternate(master, alternate, activity)


def main() -> None:
    qa_root = ROOT / "artifacts" / "v3-focus-hands-qa"
    qa_root.mkdir(parents=True, exist_ok=True)
    requested = set(sys.argv[1:])

    for character_id, points in ACTIVITY_REGIONS.items():
        if requested and character_id not in requested:
            continue
        activity = region_mask(points)
        if character_id == "red":
            master, locked = red_computer_frames()
            offset = (0, 0)
        else:
            source_path = CHARACTER_ROOT / character_id / "sheet.png"
            sheet = Image.open(source_path).convert("RGBA")
            master = sheet.crop((FRAME_SIZE, 0, FRAME_SIZE * 2, FRAME_SIZE))
            alternate = sheet.crop((FRAME_SIZE * 2, 0, FRAME_SIZE * 3, FRAME_SIZE))
            locked, offset = build_alternate(character_id, master, alternate, activity)

        master.save(CHARACTER_ROOT / character_id / "focus-1.png", optimize=True)
        locked.save(CHARACTER_ROOT / character_id / "focus-2.png", optimize=True)

        comparison = Image.new("RGBA", (FRAME_SIZE * 2, FRAME_SIZE), (0, 0, 0, 0))
        comparison.paste(master, (0, 0))
        comparison.paste(locked, (FRAME_SIZE, 0))
        comparison.save(qa_root / f"{character_id}-focus-a-b.png", optimize=True)

        outside = ImageChops.invert(activity)
        outside_difference = ImageChops.multiply(ImageChops.difference(master, locked).convert("L"), outside)
        if outside_difference.getbbox() is not None:
            raise RuntimeError(f"{character_id}: pixels changed outside the activity region")

        print(f"{character_id}: hand/prop frame offset dx={offset[0]}, dy={offset[1]}", flush=True)


if __name__ == "__main__":
    main()
