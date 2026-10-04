#!/usr/bin/env python3
"""Builds images/ + works.json for the room page.

Usage: python3 build.py
The 11 hand-picked works (islands/build.py) first, then the collection index
(grid/objects.json) in its own order until N works. Images are downloaded and
scaled locally: the museum serves no CORS headers, so WebGL can't sample them.
"""
import json, re, shutil, sys, urllib.request
from io import BytesIO
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT.parent / "islands"))
BASE = "https://onlinecollection.leopoldmuseum.org"
N, SIZE = 80, 640  # SIZE: long side in px

picks = re.findall(r"/object/(\d+)", (ROOT.parent / "islands" / "build.py").read_text())
objects = json.load(open(ROOT.parent / "grid" / "objects.json"))
index = {o["id"]: o for o in objects}
ids = list(dict.fromkeys([int(i) for i in picks] + [o["id"] for o in objects]))[:N]

shutil.rmtree(ROOT / "images", ignore_errors=True)
(ROOT / "images").mkdir()

def fetch(i):
    o = index[i]
    full = BASE + o["p"].replace("-preview.", "-default.")
    name = Path(full).name
    im = Image.open(BytesIO(urllib.request.urlopen(full).read())).convert("RGB")
    im.thumbnail((SIZE, SIZE), Image.LANCZOS)
    im.save(ROOT / "images" / name, quality=82)
    return {"src": "images/" + name, "w": im.width, "h": im.height, "title": o["t"],
            "artist": o["a"], "date": o["d"], "url": f"{BASE}/en/object/{i}/"}

with ThreadPoolExecutor(8) as pool:
    out = list(pool.map(fetch, ids))
(ROOT / "works.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(len(out), "works")
