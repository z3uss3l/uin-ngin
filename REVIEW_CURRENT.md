# UIN-NGIN – konsolidierter Stand 2026-08-25

## Ausgangslage

Die beiden gelieferten Stände wurden als Entwicklungsstand-Paar behandelt:
- `uin-ngin-main.zip`: öffentlicher/älterer Stand
- `uin-ngin-feature-ui-polish-tests.zip`: lokaler, weiterentwickelter Stand

Der Feature-Stand wurde als Basis genommen. Ältere, noch sinnvolle Komponenten wurden nicht pauschal entfernt.

## Korrigierte harte Fehler

1. `docs/UINspecificationSchemaV08.json` war strukturell kein gültiges JSON.
   - Root-Properties rekonstruiert.
   - `metadata`, `canvas`, `objects`, MCP-/Workflow-Bereiche korrekt verschachtelt.
   - fehlende `definitions.color` und `definitions.measurement` ergänzt.
   - Objektfelder `name` und freies `properties` ergänzt.
   - UIN-v0.8-Objekttypen mit Core-Validator synchronisiert.

2. Python-Importpfad `uin_ngin.import` war syntaktisch nicht importierbar, weil `import` ein Python-Schlüsselwort ist.
   - neue öffentliche Import-Schnittstelle: `uin_ngin.image_import`
   - alter Pfad bleibt aus Kompatibilitätsgründen erhalten.
   - API-Implementierungen auf den neuen Pfad umgestellt.

3. ImageExtractor hatte einen Datenflussfehler:
   - Canny-Ergebnis wurde als Dict an `cv2.findContours()` übergeben.
   - interne Edge-Matrix wird jetzt getrennt vom serialisierbaren Edge-Report weitergereicht.

4. Image-Import-Converter erzeugte keine vollständig v0.8-konformen Objekte.
   - Pixel-Koordinatensystem explizit.
   - Objektpositionen erzeugt.
   - Contour-Centroids berechnet.
   - `region`/`color_anchor` korrekt modelliert.

5. JavaScript-Core-Validator erwartete `features` als Array, während v0.8 sie als Objekt definiert.
   - Validator korrigiert.

6. `OBJECT_TYPES` war nicht mit tatsächlich erzeugten/benutzten Typen synchron.
   - `human_group`, `region`, `color_anchor`, `box` ergänzt.

7. Renderer/DepthMap kannten die neu verwendeten Typen nicht.
   - zusätzliche Renderer für Box, Region und Color Anchor.
   - DepthMap-Unterstützung ergänzt.

8. Depth-/Render-Berechnung konnte bei `z`-Bounds `[0,0]` durch Division durch null `NaN` erzeugen.
   - sichere Range-Behandlung ergänzt.

9. UI-Demos verwendeten noch UIN v0.3, obwohl die aktuelle Validierung v0.8 erwartet.
   - Samples auf v0.8 aktualisiert.

10. UI hatte harte API-/Bridge-URLs.
    - runtime-konfigurierbare `API_BASE`/`BRIDGE_BASE` wiederhergestellt.
    - Root-UI ebenfalls auf konfigurierbaren Bridge-Endpunkt umgestellt.

11. Python-Metrikmodul lag physisch außerhalb des importierten Package-Namespace.
    - `uin_ngin.metrics` als echte Package-Schnittstelle ergänzt.

12. Python-`server`/`api` waren nicht sauber als Packages erkennbar.
    - Package-Initialisierer ergänzt.

13. Pydantic-Warnung durch Feldname `schema` behoben.
    - Alias `schema` bleibt nach außen erhalten.

14. ComfyUI Node-Bridge verbessert:
    - zufällige temporäre Dateinamen
    - Cleanup in `finally`
    - Payload-/PNG-Validierung
    - konfigurierbare ComfyUI-URL
    - konfigurierbarer Port/Workflow
    - Workflow-Node-Prüfung
    - begrenzte CORS-Konfiguration
    - Timeouts

15. Python-ComfyUI-Bridge entsprechend gehärtet.

## Tests

Bestanden:

- Python Test Suite: **15 passed**
- Python Compile mit separatem Bytecode-Cache: **PASS**
- UIN-Core-v0.8 Sample Validation: **PASS**
- Adapter Integration: **PASS**
- Image Import → UIN v0.8 Schema: **PASS**
- Real API `/api/import`: **PASS**
- JS/JSX statische Syntax-/Transpile-Prüfung: **33/33 PASS**
- JSON-Dateien: **gültig**, mit Ausnahme von `.vscode/launch.json`, das bewusst JSONC ist.

## Nicht als bestanden behauptet

Ein vollständiger React-Build/Jest-Lauf konnte in der isolierten Umgebung nicht abgeschlossen werden, weil die npm-Abhängigkeiten trotz `npm ci` nicht rechtzeitig verfügbar wurden. Das ist ein Umgebungs-/Installationsproblem, kein als bestanden ausgegebener UI-Build.

Die UI-Quellen wurden deshalb separat mit TypeScript/JSX geparst: **33/33 Dateien ohne Syntaxfehler**.

## Architekturstatus

Die lokale Source-Dependency-Struktur bleibt:

`uin-core` → `uin-adapters` → `uin-ui`

Die UI referenziert die Workspace-Quellen direkt und nicht die alten eingecheckten `.tgz`-Artefakte.

Der Bildimport läuft über:

`uin_ngin.image_import`

Die Spezifikation bleibt:

`docs/UINspecificationSchemaV08.json`

und ist jetzt tatsächlich parsebar und gegen das v0.8-Testdokument validierbar.


## Nachtrag 2026-08-26 — Cross-Repository Contract Sync

- UIN v0.8 schema is synchronized from the canonical notation contract into NGIN.
- Schema keeps richer v0.8 color/measurement definitions and NGIN object types.
- `@uin/adapters` now exports the ControlNet/depth adapter (`toDepthMap`).
- JS core validation now requires UIN 0.8, unique object IDs, finite coordinates and ordered bounds.
- Canonical schema tests were added to the notation repository.
