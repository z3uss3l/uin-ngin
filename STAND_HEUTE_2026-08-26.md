# UIN Stand Heute — 2026-08-26

## Contract
- UIN specification: v0.8
- Canonical schema: `docs/UINspecificationSchemaV08.json`
- NGIN consumes the same v0.8 schema.

## Validation
- JSON Schema: Draft 7
- Core object IDs must be unique.
- Coordinates/bounds must be finite and ordered.
- JS core rejects non-v0.8 documents in strict validation.
- Adapter ControlNet export includes `toDepthMap`.

## Compatibility
- Legacy UIN v0.6/v0.7 schemas remain available.
- Legacy NGIN Python import path remains available.
