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

def extract_canny_edges(image_path: Path, low_threshold: int = 100, high_threshold: int = 200):
    """Extrahiert Canny-Kanten aus einem Bild."""
    img = cv2.imread(str(image_path))
    if img is None:
        raise ValueError(f"Konnte Bild nicht laden: {image_path}")
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, low_threshold, high_threshold)
    
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

def create_uin_package(image_path: Path, output_dir: Path, low_thresh: int = 100, high_thresh: int = 200):
    """Erstellt ein komplettes UIN-Paket aus einem Bild."""
    output_path = output_dir
    output_path.mkdir(parents=True, exist_ok=True)
    
    base_name = image_path.stem
    
    edges, stats = extract_canny_edges(image_path, low_thresh, high_thresh)
    
    edge_path = output_path / f"{base_name}_edges.png"
    cv2.imwrite(str(edge_path), edges)
    
    img_original = cv2.imread(str(image_path))
    preview = np.hstack([img_original, cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)])
    preview_path = output_path / f"{base_name}_preview.jpg"
    cv2.imwrite(str(preview_path), preview)
    
    uin_data = {
        "version": "0.8",
        "metadata": {
            "source_image": str(image_path),
            "extraction_method": "canny_edge_detection",
            "extraction_timestamp": str(np.datetime64('now')),
            "statistics": stats
        },
        "edge_reference": {
            "file_name": edge_path.name,
            "canny_thresholds": {"low": low_thresh, "high": high_thresh},
            "recommended_use": "controlnet_canny_input"
        },
        "canvas": {
            "aspect_ratio": f"{stats['original_dimensions']['width']}:{stats['original_dimensions']['height']}"
        },
        "suggested_objects": [...]  # (wie im Original, gekürzt für Platz)
    }
    
    json_path = output_path / f"{base_name}_attributes.uin.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(uin_data, f, indent=2, ensure_ascii=False)
    
    # README (wie im Original)
    # ... (vollständiger README-Code aus Original einfügen)
    
    return {
        "edge_image": str(edge_path),
        "uin_json": str(json_path),
        "preview": str(preview_path),
        "stats": stats
    }
