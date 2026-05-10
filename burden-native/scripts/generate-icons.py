#!/usr/bin/env python3
"""Generate BURDEN app icons in the wordmark style.

Black background, white "BURDEN" in JetBrains Mono Bold, generous letter-spacing.
Run: python3 scripts/generate-icons.py
Output: assets/icon.png, assets/splash-icon.png, assets/adaptive-icon.png, assets/favicon.png
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "assets"
FONT_PATH = ASSETS / "fonts" / "JetBrainsMono-Bold.ttf"

BG = (10, 10, 10)        # near-black, matches the BURDEN ink colour
FG = (247, 246, 242)     # warm paper, matches the web app bg
WORDMARK = "BURDEN"


def render(size: int, *, draw_text: bool = True) -> Image.Image:
    img = Image.new("RGB", (size, size), BG)
    if not draw_text:
        return img

    draw = ImageDraw.Draw(img)

    # Pick a font size that lets the wordmark + letterspacing sit nicely centred.
    # Letter-spacing is faked by drawing each glyph individually.
    LETTER_SPACING_RATIO = 0.18  # 18% of font size between glyphs
    target_text_width = size * 0.66

    # Binary search the font size that yields the target rendered width
    lo, hi = 8, size
    chosen_pt = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        font = ImageFont.truetype(str(FONT_PATH), mid)
        gap = int(mid * LETTER_SPACING_RATIO)
        widths = [draw.textbbox((0, 0), ch, font=font)[2] for ch in WORDMARK]
        total = sum(widths) + gap * (len(WORDMARK) - 1)
        if total <= target_text_width:
            chosen_pt = mid
            lo = mid + 1
        else:
            hi = mid - 1

    font = ImageFont.truetype(str(FONT_PATH), chosen_pt)
    gap = int(chosen_pt * LETTER_SPACING_RATIO)
    widths = [draw.textbbox((0, 0), ch, font=font)[2] for ch in WORDMARK]
    total = sum(widths) + gap * (len(WORDMARK) - 1)

    # Vertical metrics — use bbox of the whole word for a true centre
    sample_bbox = draw.textbbox((0, 0), WORDMARK, font=font)
    text_height = sample_bbox[3] - sample_bbox[1]
    y = (size - text_height) // 2 - sample_bbox[1]

    x = (size - total) // 2
    for ch, w in zip(WORDMARK, widths):
        draw.text((x, y), ch, font=font, fill=FG)
        x += w + gap

    return img


def main() -> None:
    if not FONT_PATH.exists():
        raise SystemExit(f"font missing: {FONT_PATH}")

    targets = [
        ("icon.png", 1024, True),
        ("adaptive-icon.png", 1024, True),
        ("splash-icon.png", 200, True),
        ("favicon.png", 48, True),
    ]
    for name, size, draw_text in targets:
        img = render(size, draw_text=draw_text)
        out = ASSETS / name
        img.save(out, "PNG", optimize=True)
        print(f"wrote {out.relative_to(ROOT)} ({size}x{size})")


if __name__ == "__main__":
    main()
