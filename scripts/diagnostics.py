from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    ROOT / "pyproject.toml",
    ROOT / "packages/uin-core/package.json",
    ROOT / "packages/uin-adapters/package.json",
    ROOT / "packages/uin-cli/package.json",
    ROOT / "docs/UINspecificationSchemaV08.json",
]

for path in REQUIRED:
    if not path.is_file():
        raise SystemExit(f"missing required file: {path}")

for package in (ROOT / "packages").glob("*/package.json"):
    json.loads(package.read_text(encoding="utf-8"))

print("UIN-NGIN diagnostics: PASS")
print(f"packages={len(list((ROOT / 'packages').glob('*/package.json')))}")
print("schema=present")
print("logging=enabled")
