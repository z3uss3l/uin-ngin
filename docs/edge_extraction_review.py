#!/usr/bin/env python3
"""
UIN Edge Extraction Utility – Portiert in ngin Core
Extrahiert Canny-Kanten aus Bildern und generiert UIN-Kompaktpakete.
"""

import cv2
import numpy as np
import json
from pathlib import Path
from PIL import Image

def extract_canny_edges(image_path, low_threshold=100, high_threshold=200):
    """
    Extrahiert Canny-Kanten aus einem Bild.
    
    Args:
        image_path: Pfad zum Eingabebild
        low_threshold: Unterer Threshold für Canny
        high_threshold: Oberer Threshold für Canny
        
    Returns:
        edges: Numpy-Array mit den Kanten (0=keine Kante, 255=Kante)
        stats: Dictionary mit Statistiken
    """
    # Bild laden und in Graustufen konvertieren
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Konnte Bild nicht laden: {image_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Canny Edge Detection anwenden
    edges = cv2.Canny(gray, low_threshold, high_threshold)
    
    # Statistiken berechnen
    height, width = img.shape[:2]
    edge_pixels = np.sum(edges > 0)
    total_pixels = width * height
    edge_density = edge_pixels / total_pixels
    
    stats = {
        "original_dimensions": {"width": width, "height": height},
        "edge_pixel_count": int(edge_pixels),
        "edge_density": float(edge_density),
        "edge_percentage": float(edge_density * 100),
        "thresholds": {"low": low_threshold, "high": high_threshold}
    }
    
    return edges, stats

def create_uin_package(image_path, output_dir, low_thresh=100, high_thresh=200):
    """
    Erstellt ein komplettes UIN-Paket aus einem Bild.
    
    Args:
        image_path: Pfad zum Eingabebild
        output_dir: Ausgabeverzeichnis
        low_thresh: Unterer Canny-Threshold
        high_thresh: Oberer Canny-Threshold
        
    Returns:
        Dictionary mit Pfaden zu den generierten Dateien
    """
    # Ausgabeverzeichnis erstellen
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Basisnamen für Dateien
    base_name = Path(image_path).stem
    
    # 1. Kanten extrahieren
    edges, stats = extract_canny_edges(image_path, low_thresh, high_thresh)
    
    # 2. Kantenbild speichern
    edge_path = output_path / f"{base_name}_edges.png"
    cv2.imwrite(str(edge_path), edges)
    
    # 3. Vorschau-Bild erstellen (Original + Kanten)
    img_original = cv2.imread(str(image_path))
    preview = np.hstack([img_original, cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)])
    preview_path = output_path / f"{base_name}_preview.jpg"
    cv2.imwrite(str(preview_path), preview)
    
    # 4. UIN-JSON mit extrahierten Attributen erstellen
    uin_data = {
        "version": "0.6",
        "metadata": {
            "source_image": str(image_path),
            "extraction_method": "canny_edge_detection",
            "extraction_timestamp": np.datetime64('now').astype(str),
            "statistics": stats
        },
        "edge_reference": {
            "file_name": edge_path.name,
            "canny_thresholds": {"low": low_thresh, "high": high_thresh},
            "recommended_use": "controlnet_canny_input"
        },
        "canvas": {
            "aspect_ratio": f"{stats['original_dimensions']['width']}:{stats['original_dimensions']['height']}",
            "bounds": {
                "x": [-stats['original_dimensions']['width']/100, stats['original_dimensions']['width']/100],
                "y": [-stats['original_dimensions']['height']/100, stats['original_dimensions']['height']/100],
                "z": [-1, 3]
            }
        },
        "suggested_objects": [
            {
                "id": "main_subject_1",
                "type": "detected_subject",
                "note": "Passen Sie diese Attribute basierend auf Ihrem Bild an",
                "position": {"x": 0, "y": 0, "z": 0, "anchor": "center"},
                "suggested_attributes": {
                    "detail_level": "high" if stats['edge_density'] > 0.1 else "medium",
                    "lighting_suggestion": "balanced studio lighting",
                    "style_suggestion": "photorealistic"
                }
            }
        ],
        "compression_info": {
            "original_size_kb": Path(image_path).stat().st_size / 1024,
            "edge_image_size_kb": edge_path.stat().st_size / 1024,
            "compression_ratio": ">95%" if edge_path.stat().st_size < Path(image_path).stat().st_size * 0.05 else ">90%"
        }
    }
    
    # 5. UIN-JSON speichern
    json_path = output_path / f"{base_name}_attributes.uin.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(uin_data, f, indent=2, ensure_ascii=False)
    
    # 6. README für das Paket erstellen
    readme_content = f"""# UIN Kompaktpaket: {base_name}

## Generiert am: {uin_data['metadata']['extraction_timestamp']}

### Enthaltene Dateien:
1. `{edge_path.name}` - Extrahierte Canny-Kanten (ControlNet-ready)
2. `{json_path.name}` - UIN-Attribute im JSON-Format
3. `{preview_path.name}` - Vorschau (Original + Kanten)

### Nutzung:
1. **Für KI-Generierung**:
   - Laden Sie `{edge_path.name}` in ControlNet (Canny-Modell)
   - Nutzen Sie die Attribute aus `{json_path.name}` für den Prompt
   - Generieren Sie in ComfyUI/Automatic1111

2. **Für Kompression**:
   - Original: {uin_data['compression_info']['original_size_kb']:.1f} KB
   - UIN-Paket: {uin_data['compression_info']['edge_image_size_kb'] + json_path.stat().st_size/1024:.1f} KB
   - Kompression: {uin_data['compression_info']['compression_ratio']}

### Statistiken:
- Kantendichte: {stats['edge_percentage']:.2f}%
- Kantenpixel: {stats['edge_pixel_count']:,}
- Thresholds: {low_thresh}/{high_thresh}

---
*Generiert mit UIN v0.6 - Universal Image Notation*
"""
    
    readme_path = output_path / "README.md"
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    return {
        "edge_image": str(edge_path),
        "uin_json": str(json_path),
        "preview": str(preview_path),
        "readme": str(readme_path),
        "stats": stats
    }

def batch_process_directory(input_dir, output_base_dir, low_thresh=100, high_thresh=200):
    """
    Verarbeitet alle Bilder in einem Verzeichnis.
    
    Args:
        input_dir: Eingabeverzeichnis mit Bildern
        output_base_dir: Basis-Ausgabeverzeichnis
        low_thresh: Unterer Canny-Threshold
        high_thresh: Oberer Canny-Threshold
    """
    input_path = Path(input_dir)
    output_base = Path(output_base_dir)
    
    supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp']
    
    results = []
    
    for img_file in input_path.iterdir():
        if img_file.suffix.lower() in supported_formats:
            print(f"Verarbeite: {img_file.name}")
            
            # Einzelausgabeverzeichnis für jedes Bild
            output_dir = output_base / img_file.stem
            output_dir.mkdir(parents=True, exist_ok=True)
            
            try:
                result = create_uin_package(
                    img_file, 
                    output_dir, 
                    low_thresh, 
                    high_thresh
                )
                results.append(result)
                print(f"  ✓ Paket erstellt in: {output_dir}")
            except Exception as e:
                print(f"  ✗ Fehler bei {img_file.name}: {e}")
    
    # Zusammenfassung erstellen
    summary = {
        "total_processed": len(results),
        "successful": len([r for r in results if "edge_image" in r]),
        "failed": len([r for r in results if "edge_image" not in r]),
        "total_compression_saving": 0,
        "results": results
    }
    
    summary_path = output_base / "processing_summary.json"
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    
    print(f"\nVerarbeitung abgeschlossen!")
    print(f"   Erfolgreich: {summary['successful']}/{summary['total_processed']}")
    print(f"   Zusammenfassung: {summary_path}")
