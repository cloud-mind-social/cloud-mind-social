# Q4 Series 2: photo-led

**Status:** Draft for Seul's review, like the rest of the kit. Same offer, same voice (see [voice notes](../04-social/captions.md#voice-notes-read-before-editing)), and photography replaces the type-only designs of Series 1.

## What's here

| Asset | File | Size |
|---|---|---|
| P1 "HM po?": market vendor with chat bubbles | `exports/P1-hm-po-vendor.png` | 2160×2700 (4:5 @2×) |
| P2 Page review: phone in hand | `exports/P2-unang-nakikita.png` | 2160×2700 |
| P3 Pasko: Christmas lights | `exports/P3-pasko-lights.png` | 2160×2700 |
| P4 Suki: dragon fruit at a Philippine market | `exports/P4-suki-market.png` | 2160×2700 |
| P5 Offer: coconut texture with inclusions | `exports/P5-offer-coconut.png` | 2160×2700 |
| P6 "Last post mo, August pa?": barbershop | `exports/P6-last-post-august.png` | 2160×2700 |
| A2 Square ad: laptop | `exports/A2-square-ad-laptop.png` | 2160×2160 |
| T1–T3 Stories: Pasko, "HM po?", START | `exports/T1…T3-*.png` | 2160×3840 (9:16 @2×) |
| Facebook cover | `exports/FB-cover-photo-1640x624.png` | 3280×1248 |
| A4 photo flyer | `print/CMS-Laguna-Flyer-A4-Photo.pdf` + `.png` | A4 |

Exports are 2× masters. Facebook and Instagram scale them down to 1080 wide automatically, and the extra resolution keeps type sharp after compression.

## Captions

Write each platform's caption fresh; don't cross-post. Keep them short, because the photo and headline do the work.

**P1 · "HM po?"**
"HM po?" "Available pa po?" Kung walang sumagot ng ilang oras, minsan sa iba na lang sila bibili. Kasama sa ₱1,000 package ang pagsagot namin sa comments araw-araw. Orders at PMs, ipapasa namin agad sa'yo.

**P2 · Page review**
Bago ka nila i-message, ini-scroll muna nila ang page mo. Kaya yun ang inuuna namin: oras, presyo, address, message button. Saka kami gagawa ng posts. PM mo lang yung link ng page mo.

**P3 · Pasko**
Pasko season na! Nasa page mo na ba ang holiday hours, presyo ng gift sets, at kung paano mag-order? Kami na mag-aayos niyan, plus isang buwang posts, for ₱1,000.

**P4 · Suki**
Kilala ka na ng mga suki mo. Yung bagong lipat sa subdivision, o yung dumadaan lang pauwi, page mo lang ang nakikita nila. Para sa mga negosyo sa Laguna: ₱1,000, isang buwan, kami na bahala sa page mo.

**P5 · Offer (English)**
One month, one platform, ₱1,000. We fix up your page, make a month of posts and reels, write the captions, and answer comments every day. Message us your page link.

**P6 · Last post August**
Okay lang, busy talaga pag may negosyo. Kung matagal nang walang bagong post ang page mo, kami na muna for one month. ₱1,000 for posts, reels, captions at pagsagot sa comments.

**A2 · Ad primary text**
We'll run your business page for a month: fix it up, post, and answer comments. ₱1,000. For small businesses around Laguna.

## Photo rules

- **Every photo is labeled "Stock photo"** in the corner. The people and places aren't CMS clients or staff, and the layouts never suggest they are (Brand Guidelines §13).
- No photo shows a result, a fake page, or a testimonial.
- The Christmas lights photo is from the US and has snow on the lantern. It is cropped to the bokeh lights only, so nothing reads as a non-Philippine scene. Keep that crop.
- **Better option:** replace stock with real photos of Seul, the team, or Starter clients' businesses (with written permission) as soon as they exist. Real local photos will outperform stock with this audience.

## Resolution and swapping photos

The free sources this environment could reach (rawpixel and StockSnap through Openverse) only serve previews of about 1024 px. Wikimedia, which has local Laguna photos (Calamba palengke, Los Baños, buko pie, parol), was rate-limiting this environment. To compensate:

- Layouts use split and inset crops so photos display close to their native size.
- `_design/grade.py` applies one warm grade (ink shadows, cream highlights), then upscales to 2000 px with Lanczos resampling plus a light sharpen.

**For print-size output** (the A4 flyer at 300 dpi, or a tarpaulin), download the full-resolution originals from the links below. Then run `python3 _design/grade.py <originals> photos` and re-render with `_design/render.mjs` from the repo root. Filenames must stay the same.

## Credits and licenses

Every photo is **CC0 (public domain dedication)**: free for commercial use, editing allowed, no attribution required. They are credited here anyway.

| File | Original | Creator | License | Source |
|---|---|---|---|---|
| `market-vendor.jpg` | Person preps vegetables, food stall | rawpixel | CC0 | [rawpixel 3293019](https://www.rawpixel.com/image/3293019/free-photo-image-scale-apparel-cc0) |
| `dragonfruit-market-ph.jpg` | Pitaya dragon fruit market, Philippines | rawpixel | CC0 | [rawpixel 5975069](https://www.rawpixel.com/image/5975069/pitaya-dragon-fruit-market-philippines) |
| `coconut.jpg` | Split Coconut | Oleksandr Pidvalnyi | CC0 | [StockSnap AZEZSAGD4G](https://stocksnap.io/photo/split-coconut-AZEZSAGD4G) |
| `phone-hands.jpg` | Man using iPhone | rawpixel | CC0 | [rawpixel 5928378](https://www.rawpixel.com/image/5928378/photo-image-background-iphone-phone) |
| `barbershop-chair.jpg` | Barbershop Chair | Skitter Photo | CC0 | [StockSnap 7M505B7MYV](https://stocksnap.io/photo/barbershop-chair-7M505B7MYV) |
| `laptop-cafe.jpg` | Laptop Typing | Kristin Hardwick | CC0 | [StockSnap XJMBMTYYN2](https://stocksnap.io/photo/laptop-typing-XJMBMTYYN2) |
| `lantern-blue.jpg` | Christmas night, Frankenmuth, US (cropped) | rawpixel | CC0 | [rawpixel 3291814](https://www.rawpixel.com/image/3291814/free-photo-image-christmas-tree-blossom-cc0) |

CC0 covers copyright only. The vendor in P1/T2 and the hands in P2/T3 are not identifiable faces. Still, if an ad platform or Seul wants model releases for anyone pictured, replace those photos.
