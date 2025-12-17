# uin-ngin
*can you imagine?*

Universal Image Notation Engine (uin-ngin) v0.7 – der Motor für Spezifikation, Ausführung und Monitoring.  
Während [UIN](https://github.com/z3uss3l/uin-universal-image-notation) die Sprache liefert, ist uin-ngin die Engine, die diese Sprache **ausführt, testet und sichtbar macht**.

---

🎯 **Philosophie & Design-Prinzipien**

- **Motor statt Monolith**: uin-ngin ist modular aufgebaut – klare Services, saubere Schnittstellen.  
- **Funktionalität im Zentrum**: jede Klasse erfüllt eine präzise Aufgabe (Service, CLI, GUI, Monitoring).  
- **Standards by Design**: ab v0.7 ISO/IEC 19794‑5 Schlüssel für biometrische Daten.  
- **Erweiterbarkeit**: Plugins und Adapter ermöglichen neue Workflows ohne Brüche.  
- **Transparenz**: Benchmarks und Monitoring liefern nachvollziehbare Ergebnisse.  

---

📐 **Kernfunktionen**

- **ServiceBase**: Start/Stop/Loop/Health für modulare Dienste.  
- **CLIHandler**: Pipe-fähige JSON-Ausgabe für Automatisierung.  
- **GUIHandler**: Dashboard mit REST-API und HTML-Frontend.  
- **BenchmarkSuite**: Performance-Tests mit klaren Metriken.  
- **Monitor**: Metrik-Registry für Status und Qualität.  
- **PrometheusExporter**: Ausgabe im Prometheus-Format.  
- **ConfigManager**: YAML/JSON + ENV-Overrides.  
- **PluginManager**: dynamische Erweiterungen.  
- **Adapter**: Unterkompatibilität für Legacy-Kommandos.  

---

🚀 **Praktische Beispiele aus der Praxis**

**Beispiel 1: Das Familienportrait neu erschaffen**  
„Ich habe nur ein verblasstes Foto meiner Urgroßmutter aus den 1920ern.“  
- Mit UIN: Spezifikation der Gesichtszüge und Kleidung.  
- Mit uin-ngin: Engine ausführen, Benchmarks prüfen, Ergebnis im Dashboard sichtbar machen.  

**Beispiel 2: Das Produktdesign**  
„Ich möchte sehen, wie unsere neue Flasche in einem modernen Wohnzimmer aussieht.“  
- Mit UIN: Maße und Stilbeschreibung.  
- Mit uin-ngin: Service starten, Monitoring zeigt Performanz, GUI liefert Status.  

**Beispiel 3: Der Romanautor**  
„Ich brauche ein Cover für mein Buch *Die Nacht des silbernen Wolfes*.“  
- Mit UIN: Szene definieren (Wolf, Mond, Himmel).  
- Mit uin-ngin: Engine starten, Healthcheck prüfen, Benchmark liefert Dauer und Ergebnis.  

---

📈 **Roadmap**

- **v0.6**: Fundament – Services, CLI, GUI, Monitoring, Benchmarks.  
- **v0.7**: ISO/IEC 19794‑5 Schlüssel für biometrische Daten, PluginManager, PrometheusExporter, Live-Charts.  
- **v0.8**: Cross-Domain-Kompatibilität (CAD, DICOM, Geospatial).  
- **v0.9**: Performance-Optimierung, Streaming-fähige Services.  
- **v1.0**: Stabilisierung, vollständige Testsuite, Release.  

---

🧪 **Technische Spezifikation**

- **Services**: modular, konfigurierbar, portierbar.  
- **CLI**: pipe-fähig, JSON-Ausgabe.  
- **GUI**: Dashboard mit REST-API.  
- **Monitoring**: Metriken, Benchmarks, Prometheus-Exporter.  
- **Standards**: ISO/IEC 19794‑5 ab v0.7.
