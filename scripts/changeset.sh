#!/usr/bin/env bash

set -euo pipefail

echo "🔍 Checking for Changeset files..."

CHANGES_COUNT=$(find .changeset -type f -name "*.md" | wc -l | tr -d '[:space:]')

if [ ! -d ".changeset" ]; then
  echo "⚠️ No .changeset directory found"
  exit 1
elif [ "$CHANGES_COUNT" -eq 0 ]; then
  echo "❌ No changeset found! Please add one using 'npm run bump'"
  exit 1
else
  echo "✅ Found $CHANGES_COUNT changeset file(s)"
fi
