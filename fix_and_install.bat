@echo off
setlocal ENABLEEXTENSIONS ENABLEDELAYEDEXPANSION

echo === UIN-NGIN AUTO FIX & INSTALL ===

REM --- Safety check: must be repo root ---
if not exist pyproject.toml (
    echo ERROR: pyproject.toml not found.
    echo Run this script from the uin-ngin repository root.
    exit /b 1
)

REM --- Backup existing pyproject.toml ---
echo Backing up pyproject.toml ...
copy pyproject.toml pyproject.toml.bak >nul

REM --- Write fixed pyproject.toml ---
echo Writing fixed pyproject.toml ...

(
echo [project]
echo name = "uin-core"
echo version = "1.0.0"
echo description = "Universal Image Notation – Core Engine"
echo readme = "README.md"
echo license = { file = "LICENSE" }
echo requires-python = ">=3.11"
echo.
echo dependencies = [
echo   "pydantic>=2.5",
echo   "opencv-python>=4.8.0",
echo   "pillow>=10.0.0",
echo   "numpy>=1.24.0",
echo   "jsonschema>=4.0",
echo   "fastapi>=0.110.0",
echo   "uvicorn>=0.27.0",
echo   "mcp>=0.1.0",
echo ]
echo.
echo [project.scripts]
echo uin = "uin.cli.main:main"
echo.
echo [tool.setuptools.packages.find]
echo where = ["."]
echo include = ["uin*"]
echo.
echo [build-system]
echo requires = ["setuptools>=61.0", "wheel"]
echo build-backend = "setuptools.build_meta"
) > pyproject.toml

REM --- Uninstall old package if present ---
echo Uninstalling existing uin-core (if any) ...
pip uninstall uin-core -y >nul 2>&1

REM --- Install fresh ---
echo Installing package ...
pip install . --no-cache-dir
if errorlevel 1 (
    echo ERROR: pip install failed.
    exit /b 2
)

REM --- Smoke test ---
echo Running smoke test: uin --help
uin --help
if errorlevel 1 (
    echo ERROR: uin CLI failed to start.
    exit /b 3
)

echo.
echo SUCCESS: uin-core installed and CLI is runnable.
exit /b 0
