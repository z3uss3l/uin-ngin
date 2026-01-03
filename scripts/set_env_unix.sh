#!/usr/bin/env bash
# Add git/node bin dirs to PATH by appending to ~/.profile (idempotent)
# Usage: bash scripts/set_env_unix.sh
set -euo pipefail

PROFILE="$HOME/.profile"
BACKUP="$PROFILE.bak.$(date +%s)"

echo "Detecting git/node..."
GIT_BIN=$(which git 2>/dev/null || true)
NODE_BIN=$(which node 2>/dev/null || true)

if [ -n "$GIT_BIN" ]; then GIT_DIR=$(dirname "$GIT_BIN"); fi
if [ -n "$NODE_BIN" ]; then NODE_DIR=$(dirname "$NODE_BIN"); fi

ADD_LIST=()
if [ -n "${GIT_DIR-}" ] && [[ ":$PATH:" != *":$GIT_DIR:"* ]]; then ADD_LIST+=("$GIT_DIR"); fi
if [ -n "${NODE_DIR-}" ] && [[ ":$PATH:" != *":$NODE_DIR:"* ]]; then ADD_LIST+=("$NODE_DIR"); fi

if [ ${#ADD_LIST[@]} -eq 0 ]; then
    echo "Nothing to add to PATH. Current versions (if available):"
    git --version 2>/dev/null || echo "git: not found"
    node --version 2>/dev/null || echo "node: not found"
    npm --version 2>/dev/null || echo "npm: not found"
    exit 0
fi

# Backup existing profile
if [ -f "$PROFILE" ]; then cp "$PROFILE" "$BACKUP"; echo "Backed up $PROFILE -> $BACKUP"; fi

for p in "${ADD_LIST[@]}"; do
    # Idempotent append
    if ! grep -Fq "export PATH=\"$p:\\$PATH\"" "$PROFILE" 2>/dev/null; then
        echo "# Added by uin-ngin setup: $(date)" >> "$PROFILE"
        echo "export PATH=\"$p:\$PATH\"" >> "$PROFILE"
        echo "Added $p to $PROFILE"
    fi
done

echo "To apply now: source $PROFILE"

# Quick check
for cmd in git node npm; do
    if command -v $cmd >/dev/null 2>&1; then echo "$cmd: $( $cmd --version 2>/dev/null )"; else echo "$cmd: not found"; fi
done
