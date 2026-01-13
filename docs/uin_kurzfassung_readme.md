# UIN – Universal Image Notation

## Kurzfassung

**UIN** ist ein offener, deterministischer Standard zur strukturierten Beschreibung von Bildern und Szenen.

Er trennt **Geometrie, Struktur und Relationen** strikt von Interpretation, Stil oder KI-Modellen.

UIN ist darauf ausgelegt, **langfristig stabil**, **maschinenlesbar**, **offline nutzbar** und **erweiterbar ohne Standardbruch** zu sein.

---

## Warum UIN?

- Heute existieren viele Bildformate, aber **kein neutrales Strukturformat** zwischen
  - klassischer Bildanalyse
  - CAD / Simulation
  - KI / Prompting

UIN schließt genau diese Lücke.

---

## Kerneigenschaften

- **Deterministisch** (kein Raten, keine Heuristik)
- **Schema-validierbar** (JSON Schema)
- **KI-neutral** (KI optional, nie Pflicht)
- **Tool-agnostisch** (CV, CAD, ML, manuell)
- **Edge- & Embedded-tauglich**

---

## Was UIN nicht ist

- kein Prompt-Format
- kein Scene-Graph-Framework
- kein KI-Modell
- keine Cloud-API

---

## Typische Einsatzfelder

- Forensische Dokumentation
- Computer Vision Pipelines
- Simulation / Digital Twins
- Prompt-Generierung (nachgelagert)
- Standardisierung & Forschung

---

## Ein-Satz-Definition

> **UIN ist ein offener, deterministischer Standard zur strukturierten Beschreibung von Bildern und Szenen – unabhängig davon, ob sie von Menschen, Algorithmen oder KI erzeugt werden.**

---

## Status

- Core Standard: **v0.1 (frozen)**
- Erweiterungen: Plugin-basiert
- Referenz-Tool: UIN Inspector (MVP)

