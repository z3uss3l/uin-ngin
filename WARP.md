# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands & workflows

### Python engine (backend, CLI, tests)

**Environment & install**
- Python 3.11 is required (see `pyproject.toml`).
- From repo root, after creating/activating a virtualenv:
  - Upgrade pip and install runtime + dev dependencies (editable install):
    - `python -m pip install --upgrade pip`
    - `pip install -e .[dev]`

**Run full Python test suite**
- From repo root:
  - `pytest -q`
- GitHub CI (`.github/workflows/ci.yml`) runs the same command on every push/PR to `main`.

**Run focused Python tests**
- Tests live under `tests/` grouped by domain (e.g. `tests/core`, `tests/dashboard`, `tests/integration`, `tests/plugins`, `tests/server`, `tests/workflows`).
- Examples:
  - Single file: `pytest tests/core/test_roundtrip.py`
  - Single test in that file (determinism check):
    - `pytest tests/core/test_roundtrip.py::test_roundtrip_deterministic`
- Schema validation workflow (`.github/workflows/uin-schema-validation.yml`) focuses on:
  - `pytest -q tests/test_schema_v08.py` when `*.uin.json` or `docs/UINspecificationSchemaV08.json` change.

**Run the Python CLI pipeline manually**
- The CLI is wired via `uin/cli.py` and expects JSON on stdin, returning JSON on stdout.
- Typical usage (see `README.md`):
  - Normalize a document: `python -m uin.cli normalize < input.json > output.json`
  - Other supported subcommands: `import`, `validate`, `export`.

**Run the metrics dashboard (FastAPI)**
- FastAPI app is defined in `uin/dashboard/routes.py`, started via `uin/dashboard/app.py`.
- From an environment where `uin-ngin` is installed:
  - `python -m uin.dashboard.app`
- This starts Uvicorn on `http://127.0.0.1:8000` with endpoints like `/metrics`, `/record/{metric_name}`, `/summary`.

### Node bridge server & React UI

**Local ComfyUI bridge server**
- Location: `server/comfyui-bridge.js` (see `server/package.json`).
- Install and run:
  - `cd server`
  - `npm ci` (or `npm install` if no lockfile)
  - `npm start` (runs `node comfyui-bridge.js`)
- Health check:
  - `curl http://127.0.0.1:3001/api/health`
- The CI workflow also smoke-tests this path by starting the server and curling `/api/health` and `/gui`.
- There is a simple Node-side smoke test:
  - `cd server`
  - `npm test` (runs `node test_smoke.js`).

**React UI (`@uin/ui`)**
- Location: `packages/uin-ui`.
- Scripts (from `packages/uin-ui/package.json`):
  - `npm start` → `react-scripts start` (local dev server).
  - `npm run build` → `react-scripts build` (production build under `packages/uin-ui/build`).
  - `npm test` → `react-scripts test --env=jsdom --watchAll=false --runInBand`.
- Typical flows:
  - Install deps: `cd packages/uin-ui && npm ci`.
  - Build UI: `cd packages/uin-ui && npm run build`.
  - Run UI unit tests: `cd packages/uin-ui && npm test`.
  - Run a single UI test file (only test currently in `App.test.jsx`):
    - `cd packages/uin-ui && npm test -- App.test.jsx`

**Serving the built UI via the bridge**
- `comfyui-bridge.js` serves the React build if `../packages/uin-ui/build` exists:
  - Static assets: `express.static(uiPath)`.
  - Root HTML: `GET /` → `build/index.html`.
  - Additional GUI entrypoint: `GET /gui` → `public/gui.html` if present.
- For an end-to-end local setup:
  1. Build UI: `cd packages/uin-ui && npm run build`.
  2. Start bridge: `cd server && npm start`.
  3. Ensure ComfyUI is running on `http://127.0.0.1:8188` for `/api/generate` to succeed.

**Monorepo / workspaces utilities**
- Root `package.json` configures a small Lerna monorepo for JS packages under `packages/*` and `uin/packages/*`:
  - `npm run bootstrap` → `lerna bootstrap` (link workspace packages).
  - `npm run build` → `lerna run build` (runs each package’s `build` script, e.g. `@uin/ui`).
  - `npm run clean` → `lerna clean`.
- JS workspaces:
  - `packages/uin-core` (`@uin/core`) – JS/TS representation of the UIN core.
  - `packages/uin-adapters` (`@uin/adapters`) – glue code to convert UIN documents to SVG, prompts, depth maps, etc.
  - `packages/uin-ui` (`@uin/ui`) – React GUI on top of `@uin/core` + `@uin/adapters`.
  - `uin/packages/uin-cli` (`uin-cli`) – Node-based CLI front-end wiring to the same core/adapters.

### Helper scripts (environment & UI patch)

**Environment PATH helpers (`scripts/README_ENV_SETUP.md`)**
- For Windows (PowerShell): ensure `git`, `node`, `npm` are available in `PATH`.
  - From repo root: `powershell -ExecutionPolicy Bypass -File .\scripts\set_env_windows.ps1`
- For Unix/macOS/WSL (bash):
  - From repo root: `bash ./scripts/set_env_unix.sh`
- `scripts/check_env.sh` can be used to quickly print detected versions of `git`, `node`, and `npm`.

**UI patch workflow (`scripts/README_UI_PATCH.md`)**
- Scripts automate applying a polished `App.jsx`, generating tests, running them, and pushing a feature branch:
  - Windows: `powershell -ExecutionPolicy Bypass -File .\scripts\apply_uin_ui_patch.ps1`
  - Unix/macOS: `bash ./scripts/apply_uin_ui_patch.sh`
- High-level behavior:
  1. Backup existing UI files (`App.jsx`, `src/App.test.jsx`, `package.json`) to `.bak`.
  2. Overwrite `packages/uin-ui/App.jsx` and create `packages/uin-ui/src/App.test.jsx`.
  3. Ensure test-related dev dependencies and scripts in `packages/uin-ui/package.json`.
  4. Run `npm ci`, `npm test`, and `npm run build` inside `packages/uin-ui`.
  5. Create a `feature/ui-polish-tests` branch, commit, and push.
- An `auto-create-pr` workflow will open a PR for any `feature/**` branch and label it `automerge`.

### CI/CD workflows (behaviors to be aware of)

- `ci.yml`:
  - **python-tests** job installs `.[dev]` and runs `pytest -q`.
  - **node-build** job installs server and UI dependencies, builds the UI, and smoke-tests the bridge server and `/gui` endpoint.
- `deploy.yml`:
  - Builds `packages/uin-ui` and deploys `build/` to GitHub Pages (served under `/uin-ngin`).
- `uin-schema-validation.yml`:
  - On changes to `*.uin.json` or the schema file under `docs/`, installs Python deps and runs `pytest -q tests/test_schema_v08.py`.
- `auto-create-pr.yml`:
  - On pushes to `feature/**`, auto-creates a PR targeting `main` and labels it `automerge`.

## High-level architecture

### Python core: UIN document model & pipeline

- The Python package `uin` (see `pyproject.toml` and `uin/`) is the reference engine for Universal Image Notation documents.
- **Schema & models (`uin/core/schema.py`)**:
  - Defines `UINDocument` as a Pydantic model comprising `meta` (type `UINMeta`) and a list of `Shape` instances.
  - `Shape` currently supports a small set of primitive types (`rect`, `circle`, `polygon`) with position and color information.
  - `UINMeta` holds schema version (`SCHEMA_VERSION` from `uin/core/version.py`) and a compatibility mode (`strict`, `compatible`, `lossy`).
- **Core operations (`uin/core/*.py`)**:
  - `normalize` – transforms arbitrary but schema-compatible documents into a normalized canonical form.
  - `validate` – enforces schema-level and domain-level constraints, raising `uin.core.errors.ValidationError` on failure.
  - `serialize` – produces stable JSON strings for storage/transport, used both in tests and CLI.
  - `model` – helper constructors like `create_empty()` for bootstrapping documents.
- **Pipeline orchestration (`uin/pipeline/*.py`)**:
  - `PipelineContext` (in `context.py`) is a small mutable container for the current `UINDocument` and any runtime state.
  - `steps.py` implements functional-style pipeline steps:
    - `step_import` (string JSON → `UINDocument`).
    - `step_normalize` (apply normalization).
    - `step_validate` (validate in-place, raising on failure).
    - `step_export` (`UINDocument` → serialized JSON string).
- **CLI entry (`uin/cli.py`)**:
  - Wraps the pipeline steps in a simple `argparse`-based interface.
  - Commands:
    - `import` – parse stdin into a UIN document; echo raw on success.
    - `normalize` – import, normalize, and emit normalized JSON.
    - `validate` – import and validate; echo raw JSON on success.
    - `export` – import and re-serialize via `step_export`.
  - The CLI is designed to be stream-friendly: it always reads from stdin and writes to stdout, making it easy to chain in shells or other tools.

### Dashboard & monitoring (Python)

- Located under `uin/dashboard/`.
- **`routes.py` (FastAPI app)**:
  - Exposes a small HTTP API over a process-local `DashboardMonitor` instance:
    - `GET /metrics` → raw metric map.
    - `POST /record/{metric_name}` with a numeric body → records/updates a metric.
    - `GET /summary` → human-readable summary string.
- **`monitor.py`**:
  - `DashboardMonitor` is a thin in-memory registry for named metrics; it is intentionally simple and used by the FastAPI layer.
- **`app.py`**:
  - Entry point to run the dashboard with Uvicorn (`run_dashboard`).
- **`ui.py`**:
  - Minimal visualization layer that renders `UINDocument` instances to Matplotlib figures (`render_document`).
  - Uses `Shape` definitions to draw rectangles or circles, mapping UIN color to RGBA in Matplotlib.

### Plugins & extensibility (Python)

- Located under `uin/plugins/`.
- **Interfaces** (`interfaces.py`):
  - Define abstract base classes like `Importer`, `Exporter`, and `Analyzer` that plugin authors implement.
- **PluginManager** (`manager.py`):
  - Discovers implementations under `uin.plugins.sample_plugins` (or a custom package) via `pkgutil.iter_modules`.
  - For each class in a discovered module, registers it into `importers`, `exporters`, or `analyzers` if it subclasses the corresponding interface.
  - Provides lookup helpers `get_importer`, `get_exporter`, `get_analyzer` for runtime wiring.
- **Sample plugins** (`sample_plugins/`):
  - Contain example Importer/Exporter/Analyzer implementations that illustrate how to hook into the system and are used in tests.

### JS/Node ecosystem: core, adapters, CLI & UI

- **`@uin/core` (JS)** – `packages/uin-core`:
  - JS implementation of the core UIN concepts, mirroring the Python engine at a higher level.
  - Exposed via `exports: { ".": "./src/index.js" }`.
- **`@uin/adapters` (JS)** – `packages/uin-adapters`:
  - Depends on `@uin/core` and exposes functions used by the UI, such as `toSVG`, `toPrompt`, and `toDepthMap`.
  - Implementations are designed to be swappable with test doubles; in UI tests, they are overridden with Jest mocks.
- **`uin-cli` (Node CLI)** – `uin/packages/uin-cli`:
  - Exposes a `uin` binary in Node environments (`bin/uin.js`).
  - Uses `@uin/core` and `@uin/adapters` to provide a JavaScript/Node front-end analogous to the Python CLI.
- **React UI (`@uin/ui`)** – `packages/uin-ui/src/App.jsx`:
  - Main component `UINHybridTool` provides three tabs:
    - **Editor + Preview** – JSON editor for a UIN document, live validation via `validateUIN` from `@uin/core`, SVG preview via `adapters.toSVG`, and prompt generation via `adapters.toPrompt`.
    - **Rosetta Table** – static table comparing UIN concepts to SVG attributes, text prompts, forensic categories, and CAD constructs.
    - **Export** – exposes depth map preview/download and integration hooks to ComfyUI.
  - Depth map strategy:
    - Tries `adapters.toDepthMap` first; if unavailable, falls back to an internal canvas-based generator that approximates depth from 3D positions.
  - ComfyUI integration:
    - `sendToComfyUI` posts depth maps to `/api/generate` (relative to the UI host, typically the Node bridge).
    - `generateInComfyUI` calls `http://localhost:3001/api/generate` directly and surfaces simple status messages.
  - For tests and situations without the workspace package, the component falls back from `require('@uin/adapters')` to a local `_adapters_stub`.

### Bridge server: React ↔ ComfyUI

- `server/comfyui-bridge.js` is a small Express server that mediates between the React UI and a local ComfyUI instance.
- Responsibilities:
  - Accepts `POST /api/generate` with `{ prompt, depthMapBase64 }`.
  - Writes the depth map to a temporary PNG file, uploads it to ComfyUI’s `/upload/image`, then loads a base workflow JSON (`workflows/comfyui-uin-basic.json`).
  - Injects the prompt and uploaded filename into specific workflow node inputs before posting to ComfyUI’s `/prompt` endpoint.
  - Cleans up temp files and returns a simple JSON response including `promptId`.
  - Exposes `GET /api/health` for monitoring, used in CI and for quick local checks.
- The server also statically serves the built React UI when present, tying the full stack together.

### Tests layout & intent

- Python tests (`tests/`) are organized by subsystem:
  - `tests/core/` – core behavior, e.g. deterministic roundtrips between `normalize` and `serialize`.
  - `tests/cli/` – CLI-level behaviors over the pipeline.
  - `tests/dashboard/` – FastAPI dashboard endpoints and monitor behavior.
  - `tests/plugins/` – plugin discovery and registration via `PluginManager`.
  - `tests/server/` – expectations around server-side artifacts used by the JS bridge.
  - `tests/workflows/` – workflow-level behaviors, including API examples.
  - `tests/integration/` – cross-boundary tests like `test_python_bridge.py`.
- JS tests:
  - `packages/uin-ui/src/App.test.jsx` focuses on the Export tab’s interaction flow, ensuring depth maps enable the “Send to ComfyUI” button and that the correct payload is sent to `/api/generate`.

## Repository mental model

- Think of **uin-ngin** as a multi-language engine around a single UIN document model:
  - **Python** provides the canonical schema, validation, normalization, dashboard, and reference CLI.
  - **JavaScript/Node** provides UI/UX, an alternate CLI, and a thin bridge to external image-generation backends (currently ComfyUI).
- The system is deliberately modular:
  - Core data model and pipeline are Python-first in `uin/`.
  - Cross-language interoperability is provided via the JS `@uin/core` and `@uin/adapters` packages.
  - The React UI is a consumer of the adapters; the Node bridge is a transport layer to ComfyUI.
  - Plugins (Python) and adapters (JS) are the main extension points for new formats, exporters, or analysis pipelines.
