#!/usr/bin/env bash
# Quick environment checker
set -euo pipefail

echo "Checking git/node/npm availability..."
for cmd in git node npm; do
  if command -v $cmd >/dev/null 2>&1; then
    printf "%s: %s\n" "$cmd" "$($cmd --version 2>/dev/null | tr -d '\n')"
  else
    printf "%s: not found\n" "$cmd"
  fi
done

if [ -x "$(command -v node 2>/dev/null || true)" ]; then
  echo "Node is runnable."
else
  echo "Node not available in this shell. On Windows, consider running: scripts/set_env_windows.ps1"
fi
