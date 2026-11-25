#!/usr/bin/env python3
"""Ritar ikon, favicon, og-bild, manifest, robots och sitemap för Kretssnurran.
Ingen tredjepart. Ikonen är en glödlampa med två sladdändar – appens mekanik – tre
tjocka former, inga tunna streck, så den överlever 48 px."""
import pathlib
from PIL import Image, ImageDraw, ImageFont

P = pathlib.Path(__file__).parent / "public"
P.mkdir(exist_ok=True)
GRON = (47, 125, 90, 255)
PAPPER = (250, 247, 242, 255)
GUL = (255, 214, 92, 255)
MORK = (20, 24, 31, 255)


def lampa(d, N, glod=GUL, sladd=MORK):
    cx, cy = N * 0.5, N * 0.44
    r = N * 0.21
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=glod)
    # sockel
    w, h = r * 0.95, r * 0.72
    d.rounded_rectangle([cx - w / 2, cy + r * 0.72, cx + w / 2, cy + r * 0.72 + h],
                        radius=N * 0.02, fill=(235, 235, 235, 255))
    # två sladdar ned till kanten
    d.rectangle([cx - r * 0.75, cy + r * 1.7, cx - r * 0.55, N * 0.86], fill=sladd)
    d.rectangle([cx + r * 0.55, cy + r * 1.7, cx + r * 0.75, N * 0.86], fill=sladd)


def ikon(N, med_bakgrund=True):
    ss = 4
    im = Image.new("RGBA", (N * ss, N * ss), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if med_bakgrund:
        d.rounded_rectangle([0, 0, N * ss - 1, N * ss - 1], radius=N * ss * 0.23, fill=GRON)
    lampa(d, N * ss, GUL, (255, 255, 255, 255))
    return im.resize((N, N), Image.LANCZOS)


def skriv_ikoner():
    (P / "favicon.svg").write_text(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<rect width="100" height="100" rx="23" fill="#2f7d5a"/>'
        '<circle cx="50" cy="43" r="21" fill="#ffd65c"/>'
        '<rect x="40" y="58" width="20" height="13" rx="3" fill="#ebebeb"/>'
        '<rect x="34" y="71" width="5" height="15" fill="#fff"/>'
        '<rect x="61" y="71" width="5" height="15" fill="#fff"/></svg>', encoding="utf-8")
    ikon(512).save(P / "favicon.png")
    ikon(192).save(P / "icon-192.png")
    ikon(512).save(P / "icon-512.png")
    N = 512
    im = Image.new("RGBA", (N, N), GRON)
    inner = Image.new("RGBA", (int(N * 0.7), int(N * 0.7)), (0, 0, 0, 0))
    di = ImageDraw.Draw(inner)
    lampa(di, int(N * 0.7), GUL, (255, 255, 255, 255))
    im.paste(inner, (int(N * 0.15), int(N * 0.15)), inner)
    im.save(P / "icon-maskable-512.png")
    (P / "apple-touch-icon.png").write_bytes((P / "icon-192.png").read_bytes())


def og_bild():
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), PAPPER[:3])
    d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, W, H], radius=0, fill=(242, 236, 225))
    # slinga
    d.rounded_rectangle([90, 120, W - 90, H - 90], radius=90, outline=(140, 122, 99), width=16)
    # lampa i mitten
    lampa(d, 420, GUL, (90, 78, 63, 255))
    im2 = Image.new("RGB", (420, 420), (242, 236, 225))
    dl = ImageDraw.Draw(im2)
    lampa(dl, 420, GUL, (90, 78, 63, 255))
    im.paste(im2, (W // 2 - 210, 175))
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 54)
    except Exception:
        font = ImageFont.load_default()
    d.text((W // 2, H - 62), "Kretssnurran – sätt ström på rätt väg", font=font, fill=(20, 24, 31), anchor="mm")
    im.save(P / "og.png")


def manifest():
    import json
    data = {
        "name": "Kretssnurran",
        "short_name": "Kretssnurran",
        "description": "Koppla batteri, lampa och strömbrytare så att lampan lyser. Fysik åk 4–6.",
        "lang": "sv-SE",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "orientation": "any",
        "background_color": "#faf7f2",
        "theme_color": "#faf7f2",
        "icons": [
            {"src": "icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
        ],
    }
    (P / "site.webmanifest").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    (P / "robots.txt").write_text("User-agent: *\nAllow: /\nSitemap: https://kretssnurran.shipholm.dev/sitemap.xml\n", encoding="utf-8")
    (P / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
        '<url><loc>https://kretssnurran.shipholm.dev/</loc></url></urlset>\n', encoding="utf-8")


if __name__ == "__main__":
    skriv_ikoner()
    og_bild()
    manifest()
    print("ikoner, og, manifest, robots, sitemap klara")