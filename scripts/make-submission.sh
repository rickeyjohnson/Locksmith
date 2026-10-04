#!/usr/bin/env bash
# Builds the course submission ZIP outside the repository.
#
#   bash scripts/make-submission.sh [checkpoint]    # e.g. 1 or 2, default 2
#
# Output: ../Locksmith_CP<n>_Rickey_Johnson.zip
#
# Never includes levels.secrets.json, .env.local, node_modules, .next, .git, or
# collected player data.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CP="${1:-2}"                      # which checkpoint to package; defaults to the latest
NAME="Locksmith_CP${CP}_Rickey_Johnson"
OUT_DIR="$(dirname "$REPO")"
STAGE="$(mktemp -d)/$NAME"

mkdir -p "$STAGE"/{report,results,research,source-code}

# 1. Top-level README so the instructor sees how to run it without opening source-code/
cp "$REPO/README.md" "$STAGE/README.md"

# 2. The written report for this checkpoint
cp "$REPO"/docs/checkpoint"$CP"/*.pdf "$STAGE/report/" 2>/dev/null || true
cp "$REPO"/docs/checkpoint"$CP"/*.docx "$STAGE/report/" 2>/dev/null || true
cp "$REPO"/docs/checkpoint"$CP"/*.html "$STAGE/report/" 2>/dev/null || true
if ! ls "$STAGE/report/"* >/dev/null 2>&1; then
  echo "ABORT: no report found in docs/checkpoint$CP/" >&2
  exit 1
fi

# 3. Results: the summary tables and the full raw CSVs behind them
cp "$REPO"/docs/results/*.csv "$STAGE/results/"
cp "$REPO"/docs/checkpoint1/*.csv "$STAGE/results/" 2>/dev/null || true

# 4. Research notes, the label audit, and the design/build documents
cp "$REPO"/docs/research/*.md "$STAGE/research/"
cp "$REPO"/docs/results/label-audit.md "$STAGE/results/" 2>/dev/null || true
cp "$REPO"/docs/playtest.md "$STAGE/research/" 2>/dev/null || true
mkdir -p "$STAGE/research/design"
cp "$REPO"/docs/superpowers/specs/*.md "$STAGE/research/design/"
cp "$REPO"/docs/superpowers/plans/*.md "$STAGE/research/design/"

# 5. Source code — everything needed to run, nothing generated or secret
cd "$REPO"
git ls-files -z | while IFS= read -r -d '' f; do
  case "$f" in
    docs/*) continue ;;                 # already staged above
  esac
  mkdir -p "$STAGE/source-code/$(dirname "$f")"
  cp "$f" "$STAGE/source-code/$f"
done

# 6. Guard: fail loudly rather than ship a secret
if find "$STAGE" \( -name ".env.local" -o -name "levels.secrets.json" \) | grep -q .; then
  echo "ABORT: a secrets file reached the staging directory" >&2
  exit 1
fi
# Match real key shapes only: a placeholder like <service-role key> is fine.
if grep -rIlE -e "sb_secret_[A-Za-z0-9_-]{8,}" -e "SUPABASE_SERVICE_KEY=[A-Za-z0-9]" "$STAGE" 2>/dev/null | grep -q .; then
  echo "ABORT: a live key reached the staging directory" >&2
  exit 1
fi

rm -f "$OUT_DIR/$NAME.zip"
(cd "$(dirname "$STAGE")" && zip -qr "$OUT_DIR/$NAME.zip" "$NAME" -x '*.DS_Store')
rm -rf "$(dirname "$STAGE")"

echo "Wrote $OUT_DIR/$NAME.zip"
unzip -l "$OUT_DIR/$NAME.zip" | tail -1
