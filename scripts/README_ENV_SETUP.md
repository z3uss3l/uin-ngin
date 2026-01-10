# Environment setup helpers (git, node, npm)

This folder contains small scripts to help ensure `git`, `node` and `npm` are available in your PATH.

Windows
- Script: `scripts/set_env_windows.ps1`
- Usage (PowerShell):
  - Run: `powershell -ExecutionPolicy Bypass -File scripts\set_env_windows.ps1`
  - The script detects common install locations for Git and Node.js and will add them to your **user** PATH. You may need to restart terminals to pick up changes.

Unix / WSL / macOS
- Script: `scripts/set_env_unix.sh`
- Usage (bash):
  - Run: `bash scripts/set_env_unix.sh`
  - The script appends export lines to `~/.profile` and makes a backup before editing. `source ~/.profile` to apply immediately.

Check Installation
- Script: `scripts/check_env.sh` — prints versions or `not found` for `git`, `node`, `npm`.

Notes
- These scripts are convenience helpers and perform idempotent edits where possible. They do not install Git or Node.js — if the binaries are not present, install them first:
  - Git: https://git-scm.com/downloads
  - Node.js: https://nodejs.org/

Security
- Modifying environment variables affects your user session. Review the script content before running, and ensure you trust the environment.
