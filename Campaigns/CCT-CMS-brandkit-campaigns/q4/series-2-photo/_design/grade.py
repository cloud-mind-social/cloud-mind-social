"""Give every stock photo the same warm grade so the set reads as one series in the CMS palette.

Usage: python3 grade.py <source_dir> <out_dir>
Writes <out_dir>/<name>.jpg for each JPEG in <source_dir>. Re-run after swapping in higher-resolution originals.
"""
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter

CREAM = (247, 242, 234)  # --cream
INK = (28, 27, 26)  # --mind


def grade(im: Image.Image) -> Image.Image:
    im = im.convert("RGB")
    im = ImageEnhance.Color(im).enhance(0.86)  # calm the saturation
    im = ImageEnhance.Contrast(im).enhance(1.06)
    # Map black → ink and white → cream so shadows and highlights share the brand's warmth.
    r, g, b = im.split()
    lut = lambda lo, hi: [round(lo + (hi - lo) * i / 255) for i in range(256)]
    im = Image.merge("RGB", (r.point(lut(INK[0], CREAM[0])), g.point(lut(INK[1], CREAM[1])), b.point(lut(INK[2], CREAM[2]))))
    # Upscale small sources toward print/social size with a gentle sharpen.
    if im.width < 2000:
        f = 2000 / im.width
        im = im.resize((round(im.width * f), round(im.height * f)), Image.LANCZOS)
        im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=60, threshold=2))
    return im


if __name__ == "__main__":
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    for p in sorted(src.glob("*.jpg")):
        grade(Image.open(p)).save(out / p.name, quality=90, optimize=True, progressive=True)
        print("graded", p.name)
