@echo off
setlocal enabledelayedexpansion

echo === UIN-NGIN PHASE 2: CORE FIX ===

set ROOT=%~dp0
cd /d "%ROOT%"

set TARGET=uin\core\schema.py
set PATCH=_patch_schema_tmp.py

if not exist "%TARGET%" (
    echo ERROR: %TARGET% not found.
    exit /b 1
)

echo Backing up %TARGET% ...
copy "%TARGET%" "%TARGET%.bak" >nul

echo Writing Python patch helper ...

(
echo from pathlib import Path
echo import re
echo path = Path(r"uin\core\schema.py")
echo text = path.read_text(encoding="utf-8")
echo text2 = re.sub(r"\bschema\b", "uin_schema", text)
echo if text == text2:
echo^    print("No changes needed.")
echo else:
echo^    path.write_text(text2, encoding="utf-8")
echo^    print("schema field patched")
