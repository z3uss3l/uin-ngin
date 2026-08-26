# UIN-NGIN Release Manifest — 2026-08-26

Canonical contract: UIN v0.8.

## Included
- JavaScript core (`@uin/core`)
- adapters (`@uin/adapters`)
- React UI (`@uin/ui`)
- Python API/CLI/services
- image import and validation
- ComfyUI bridge
- tests and workflows

## Compatibility
- UIN v0.8 object types include `human`, `human_group`, `tree`, `car`, `building`, `region`, `color_anchor`, `box`, `person`, and `bench`.
- `person` renders as `human`; `bench` renders as `box` for compatibility.
- No generated `node_modules`, build output, logs, egg-info or backup files are part of the release archive.

## Verification
`python -m pytest -q` and Node core/adapter integration tests are the release gates.
