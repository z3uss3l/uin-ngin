# UIN-NGIN Logging / Debugging / Test Expansion — 2026-08-26

## Added

- structured Python logger with text/JSON output and optional file sink
- `UIN_LOG_LEVEL`, `UIN_LOG_FORMAT`, `UIN_LOG_FILE`
- CLI `--log-level` and `--log-format`
- pipeline/import/normalize/validate lifecycle events
- image extraction lifecycle events
- ComfyUI bridge request IDs and lifecycle events
- structured JavaScript core logger with debug/info/warn/error levels
- validator debug events
- UIN-Tool browser logger and operation-level diagnostics
- environment diagnostics helper
- regression guards for validation bypasses and simulation markers
- dedicated logger tests

## Safety

Logging deliberately excludes complete UIN documents, image bytes, credentials and bearer tokens. Context is limited to operational metadata such as object counts, byte counts, request IDs and durations/status values.

## Verification

- NGIN Python: **20 passed**
- NGIN Node core/adapter/logger/version: **3 passed**
- Reference specification Python: **6 passed, 1 skipped** (optional MCP integration)
- v0.8 schema CLI validation: **PASS**
- UIN-Tool static verification: **PASS**
- validation-bypass guard: **PASS**
- archive/package transient artifacts removed before release packaging

## Known environment limitation

A full `npm install` / Vite production build for `uin-tool` cannot be completed reliably in this isolated environment; the dependency installation timed out. This is not reported as a build pass.
