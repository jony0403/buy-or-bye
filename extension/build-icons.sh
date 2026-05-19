#!/bin/bash
# extension_icon.png → 확장 아이콘 (비율 유지, 잘림 없음)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${ROOT}/extension_icon.png"
OUT="$(cd "$(dirname "$0")" && pwd)/icons"

mkdir -p "$OUT"
for s in 16 32 48 128; do
  sips -z "$s" "$s" "$SRC" --out "$OUT/icon${s}.png" >/dev/null
done
echo "Icons written to $OUT"
