#!/usr/bin/env python3
"""Build Focus sheets whose non-activity pixels are locked to frame one.

Run with the bundled Codex Python runtime (Pillow and NumPy are required):

    python scripts/build-locked-focus-sheets.py

The generated `sheet-locked.png` files preserve the source sheets. Each Focus
frame B starts as an exact copy of frame A, then receives only a feathered patch
inside the character-specific activity region.
"""

from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
CHARACTER_ROOT = ROOT / "assets" / "characters"
FRAME_SIZE = 512

# Polygons cover only the activity: controller/hands, rod/bobber, mixer hand,
# book pages, and clapboard. Body pixels outside these regions cannot change.
ACTIVITY_REGIONS = {
    "yellow": [(145, 310), (370, 310), (370, 415), (145, 415)],
    "blue": [(410, 205), (455, 205), (455, 440), (410, 440)],
    "green": [(255, 315), (390, 315), (390, 425), (255, 425)],
    "red": [(140, 275), (370, 275), (370, 385), (140, 385)],
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


def yellow_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    draw = ImageDraw.Draw(result)
    outline = (67, 38, 24, 255)
    draw.ellipse((284, 348, 296, 360), fill=(246, 196, 52, 255), outline=outline, width=2)
    draw.ellipse((298, 348, 310, 360), fill=(94, 174, 226, 255), outline=outline, width=2)
    draw.ellipse((284, 362, 296, 374), fill=(106, 201, 112, 255), outline=outline, width=2)
    draw.ellipse((298, 362, 310, 374), fill=(236, 102, 74, 255), outline=outline, width=2)
    return result


def blue_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    bobber = master.crop((414, 382, 449, 433))
    draw = ImageDraw.Draw(result)
    draw.rectangle((424, 219, 450, 438), fill=(0, 0, 0, 0))
    draw.line((431, 216, 431, 313), fill=(72, 48, 37, 255), width=2)
    result.alpha_composite(bobber, (414, 300))
    return result


def green_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    draw = ImageDraw.Draw(result)
    outline = (62, 48, 31, 255)
    draw.rounded_rectangle((269, 379, 280, 398), radius=2, fill=(240, 207, 61, 255), outline=outline, width=1)
    draw.rounded_rectangle((300, 371, 311, 398), radius=2, fill=(112, 220, 95, 255), outline=outline, width=1)
    draw.rounded_rectangle((332, 385, 343, 398), radius=2, fill=(240, 207, 61, 255), outline=outline, width=1)
    return result


def red_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    draw = ImageDraw.Draw(result)
    page = [(253, 361), (318, 291), (326, 346)]
    draw.polygon(page, fill=(255, 240, 201, 255))
    draw.line(page + [page[0]], fill=(67, 38, 24, 255), width=4, joint="curve")
    draw.line((253, 361, 301, 343), fill=(215, 187, 137, 255), width=2)
    return result


def purple_alternate(master: Image.Image) -> Image.Image:
    result = master.copy()
    draw = ImageDraw.Draw(result)
    draw.ellipse((422, 291, 440, 309), fill=(239, 79, 70, 255), outline=(45, 34, 38, 255), width=3)
    draw.ellipse((427, 296, 435, 304), fill=(255, 190, 118, 255))
    return result


def build_alternate(character_id: str, master: Image.Image, alternate: Image.Image, activity: Image.Image) -> tuple[Image.Image, tuple[int, int]]:
    if character_id == "yellow":
        return yellow_alternate(master), (0, 0)
    if character_id == "blue":
        return blue_alternate(master), (0, 0)
    if character_id == "green":
        return green_alternate(master), (0, 0)
    if character_id == "red":
        return red_alternate(master), (0, 0)
    if character_id == "purple":
        return purple_alternate(master), (0, 0)
    return patched_alternate(master, alternate, activity)


def main() -> None:
    qa_root = ROOT / "artifacts" / "v3-focus-lock-qa"
    qa_root.mkdir(parents=True, exist_ok=True)
    requested = set(sys.argv[1:])

    for character_id, points in ACTIVITY_REGIONS.items():
        if requested and character_id not in requested:
            continue
        source_path = CHARACTER_ROOT / character_id / "sheet.png"
        sheet = Image.open(source_path).convert("RGBA")
        master = sheet.crop((FRAME_SIZE, 0, FRAME_SIZE * 2, FRAME_SIZE))
        alternate = sheet.crop((FRAME_SIZE * 2, 0, FRAME_SIZE * 3, FRAME_SIZE))
        activity = region_mask(points)
        locked, offset = build_alternate(character_id, master, alternate, activity)

        output_sheet = sheet.copy()
        output_sheet.paste(locked, (FRAME_SIZE * 2, 0))
        output_path = CHARACTER_ROOT / character_id / "sheet-locked.png"
        output_sheet.save(output_path, optimize=True)

        comparison = Image.new("RGBA", (FRAME_SIZE * 2, FRAME_SIZE), (0, 0, 0, 0))
        comparison.paste(master, (0, 0))
        comparison.paste(locked, (FRAME_SIZE, 0))
        comparison.save(qa_root / f"{character_id}-focus-a-b.png", optimize=True)

        outside = ImageChops.invert(activity)
        outside_difference = ImageChops.multiply(ImageChops.difference(master, locked).convert("L"), outside)
        if outside_difference.getbbox() is not None:
            raise RuntimeError(f"{character_id}: pixels changed outside the activity region")

        print(f"{character_id}: aligned alternate by dx={offset[0]}, dy={offset[1]}", flush=True)


if __name__ == "__main__":
    main()
