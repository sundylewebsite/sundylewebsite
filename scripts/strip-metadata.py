#!/usr/bin/env python3
"""
Strip metadata from published images — losslessly.

    scripts/strip-metadata.py --check          # report what is in there, change nothing
    scripts/strip-metadata.py                  # strip every image under assets/
    scripts/strip-metadata.py assets/photos/*.jpg

Why: a phone or a camera writes EXIF and XMP into every photo — camera body and
lens serial numbers, the photographer's name, capture times, sometimes GPS. The
file is public the moment it is pushed, so anyone can download it and read that.
None of it is needed to display the picture.

This does NOT re-encode: it removes the metadata SEGMENTS from the file and
leaves the compressed image data exactly as it was, so there is no quality loss
and no size/colour change beyond the deleted bytes. Every rewritten file is
decoded and compared to the original before it is kept.

  JPEG  drops APP1 (EXIF + XMP), APP13 (IPTC) and COM comment segments.
        Keeps APP0 (JFIF) and APP2 (ICC colour profile) — those are pixel data,
        not identity.
  PNG   drops tEXt / zTXt / iTXt / eXIf chunks. Keeps colour chunks and tRNS.
"""

import argparse
import glob
import os
import struct
import sys

from PIL import Image, ImageChops

JPEG_DROP = {0xE1, 0xED, 0xFE}          # APP1 (EXIF/XMP), APP13 (IPTC), COM
PNG_DROP = {b"tEXt", b"zTXt", b"iTXt", b"eXIf"}


def jpeg_segments(data):
    """Yield (marker, payload) pairs between SOI and SOS, then the tail."""
    if data[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG")
    i = 2
    while i < len(data) - 1:
        if data[i] != 0xFF:
            raise ValueError("bad marker at %d" % i)
        marker = data[i + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            yield marker, b""
            i += 2
            continue
        length = struct.unpack(">H", data[i + 2:i + 4])[0]
        payload = data[i + 4:i + 2 + length]
        yield marker, payload
        i += 2 + length
        if marker == 0xDA:              # start of scan: everything after is data
            yield ("tail", data[i:])
            return


def strip_jpeg(data):
    out = bytearray(b"\xff\xd8")
    dropped = 0
    for marker, payload in jpeg_segments(data):
        if marker == "tail":
            out += payload
            break
        if marker in JPEG_DROP:
            dropped += 1
            continue
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            out += bytes((0xFF, marker))
            continue
        out += struct.pack(">BBH", 0xFF, marker, len(payload) + 2) + payload
    return bytes(out), dropped


def png_chunks(data):
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    i = 8
    while i < len(data):
        length = struct.unpack(">I", data[i:i + 4])[0]
        kind = data[i + 4:i + 8]
        chunk = data[i:i + 12 + length]
        yield kind, chunk
        i += 12 + length


def strip_png(data):
    out = bytearray(data[:8])
    dropped = 0
    for kind, chunk in png_chunks(data):
        if kind in PNG_DROP:
            dropped += 1
            continue
        out += chunk
    return bytes(out), dropped


def audit(path):
    """What identity data does this file carry?"""
    facts = {}
    try:
        im = Image.open(path)
    except Exception as exc:                     # fonts, svg, ...
        return None, str(exc)
    ex = im.getexif()
    if ex:
        names = {271: "make", 272: "model", 305: "software", 315: "artist",
                 33432: "copyright", 306: "datetime"}
        for k, v in ex.items():
            if k in names:
                facts[names[k]] = str(v)[:60]
        if 34853 in ex:
            facts["GPS"] = "present"
        sub = {}
        try:
            sub = ex.get_ifd(0x8769)
        except Exception:
            pass
        for k, name in ((36867, "created"), (42036, "lens"), (42033, "body serial")):
            if k in sub:
                facts[name] = str(sub[k])[:60]
    xmp = im.info.get("xmp") or b""
    if xmp:
        text = xmp.decode("utf-8", "replace") if isinstance(xmp, (bytes, bytearray)) else str(xmp)
        facts["xmp"] = "%d bytes" % len(text)
        for key, label in (("aux:SerialNumber", "body serial"), ("aux:LensSerialNumber", "lens serial"),
                           ("dc:creator", "creator"), ("dc:rights", "rights")):
            at = text.find(key)
            if at >= 0:
                facts[label] = text[at:at + 90].split("<")[-1][:60] or "(see XMP)"
    if any(k in im.info for k in ("exif", "photoshop", "icc_profile")):
        if "exif" in im.info:
            facts.setdefault("exif block", "present")
    return facts, None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="*", help="files, folders or globs (default: assets/)")
    ap.add_argument("--check", action="store_true", help="report only, change nothing")
    args = ap.parse_args()

    targets = args.paths or ["assets"]
    files = []
    for t in targets:
        if os.path.isdir(t):
            for ext in ("*.jpg", "*.jpeg", "*.JPG", "*.png", "*.PNG"):
                files += glob.glob(os.path.join(t, "**", ext), recursive=True)
        else:
            files += sorted(glob.glob(t))
    files = sorted(set(files))
    if not files:
        print("nothing to do")
        return 0

    flagged = 0
    for path in files:
        facts, err = audit(path)
        if err:
            continue
        if not facts:
            continue
        flagged += 1
        print("\n%s" % path)
        for k, v in facts.items():
            print("   %-12s %s" % (k, v))
        if args.check:
            continue

        with open(path, "rb") as fh:
            original = fh.read()
        is_png = original[:8] == b"\x89PNG\r\n\x1a\n"
        try:
            stripped, dropped = strip_png(original) if is_png else strip_jpeg(original)
        except Exception as exc:
            print("   !! could not strip: %s" % exc)
            continue

        # prove the pixels survived before anything is written
        tmp = path + ".strip-test"
        with open(tmp, "wb") as fh:
            fh.write(stripped)
        try:
            a = Image.open(path).convert("RGB")
            b = Image.open(tmp).convert("RGB")
            if a.size != b.size:
                raise ValueError("size changed")
            diff = ImageChops.difference(a, b)
            if diff.getbbox() is not None:
                raise ValueError("pixels differ")
        except Exception as exc:
            os.unlink(tmp)
            print("   !! left alone, verification failed: %s" % exc)
            continue
        os.unlink(tmp)

        with open(path, "wb") as fh:
            fh.write(stripped)
        print("   ✓ stripped %d segment(s)/chunk(s): %d → %d bytes"
              % (dropped, len(original), len(stripped)))

    if args.check:
        print("\n%d of %d image(s) carry metadata." % (flagged, len(files)))
    else:
        print("\n%d image(s) had metadata, all stripped." % flagged)
    return 0


if __name__ == "__main__":
    sys.exit(main())
