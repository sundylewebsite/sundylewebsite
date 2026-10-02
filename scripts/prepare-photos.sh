#!/usr/bin/env bash
# =============================================================================
# SUN.DYLE — prepare photos for the website
#
# Turns phone/camera files (JPEG, PNG, HEIC, TIFF) into web-ready JPEGs:
# resized, stripped of colour-profile bloat, correctly named.
#
#   Gallery (the default — numbers files photo-01, photo-02, … in order):
#     scripts/prepare-photos.sh ~/Desktop/band-shoot
#     scripts/prepare-photos.sh ~/Desktop/band-shoot assets/photos/gallery
#
#   One-off images (hero background or the About photo):
#     scripts/prepare-photos.sh ~/Desktop/wide-shot.jpg --as hero
#     scripts/prepare-photos.sh ~/Desktop/band-portrait.jpg --as band
#
# Already-correct files are left alone: the gallery numbers itself from the
# first free slot, so running it twice adds photos instead of overwriting.
# =============================================================================
set -euo pipefail

MAX_PX="${MAX_PX:-1600}"      # longest edge of the output image
QUALITY="${QUALITY:-82}"      # JPEG quality
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

die() { printf '\033[31merror:\033[0m %s\n' "$1" >&2; exit 1; }

if [ $# -lt 1 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  sed -n '2,20p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
  exit 0
fi

command -v sips >/dev/null || die "sips not found — this script is for macOS."

SRC="$1"
[ -e "$SRC" ] || die "no such file or folder: $SRC"

convert_one() {                 # convert_one <input> <output>
  local in="$1" out="$2"
  sips -s format jpeg -s formatOptions "$QUALITY" \
       --resampleHeightWidthMax "$MAX_PX" \
       --deleteColorManagementProperties \
       "$in" --out "$out" >/dev/null 2>&1 \
    || die "could not convert $in"
}

case "${2:-}" in
  --as)
    NAME="${3:-}"
    case "$NAME" in
      hero|band) ;;
      *) die "--as takes 'hero' or 'band'" ;;
    esac
    OUT="$ROOT/assets/photos/$NAME.jpg"
    case "$(echo "$SRC" | tr 'A-Z' 'a-z')" in
      *.jpg|*.jpeg) MAX_PX="${MAX_PX}" convert_one "$SRC" "$OUT.tmp";;
      *) convert_one "$SRC" "$OUT.tmp";;
    esac
    mv "$OUT.tmp" "$OUT"
    printf 'wrote %s  (%s)\n' "$OUT" "$(du -h "$OUT" | cut -f1)"
    exit 0
    ;;
esac

DEST="${2:-$ROOT/assets/photos/gallery}"
mkdir -p "$DEST"

# find the first free photo-NN.jpg slot
next=1
while [ -e "$(printf '%s/photo-%02d.jpg' "$DEST" "$next")" ]; do next=$((next + 1)); done

count=0
while IFS= read -r -d '' f; do
  base="$(basename "$f")"
  case "$(echo "$base" | tr 'A-Z' 'a-z')" in *.jpg|*.jpeg) ;; esac
  out="$(printf '%s/photo-%02d.jpg' "$DEST" "$next")"
  convert_one "$f" "$out.tmp"
  mv "$out.tmp" "$out"
  printf '  %-40s -> %s\n' "$base" "$(basename "$out")"
  next=$((next + 1)); count=$((count + 1))
done < <(find "$SRC" -maxdepth 2 -type f \
           \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \
           -o -iname '*.heic' -o -iname '*.tif' -o -iname '*.tiff' \) \
           -print0 | sort -z)

[ "$count" -gt 0 ] || die "no images found in $SRC"
printf '\n%d photo(s) added to %s\n' "$count" "$DEST"
printf 'Reload the page — they appear in order automatically.\n'
