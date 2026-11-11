#!/bin/sh
# Builds a Chrome Web Store zip containing only shipping files.
set -eu
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./manifest.json').version")
OUT="dist/text-case-converter-$VERSION.zip"
mkdir -p dist && rm -f "$OUT"
zip -X "$OUT" manifest.json background.js content.js options.html options.css options.js icon16.png icon48.png icon128.png
echo "Built $OUT"; unzip -l "$OUT"
