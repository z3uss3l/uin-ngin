#!/usr/bin/env python3
"""
Reverse UIN: Extrahiert Canny Edges und Attribute aus Bildern
"""

import cv2
import numpy as np
import json
import base64
from PIL import Image
import io
import os
from datetime import datetime
from colorthief import ColorThief
import warnings
warnings.filterwarnings('ignore')

class UINReverseExtractor:
    def __init__(self):
        self.version = "uin-v0.6-hybrid"
        
    def extract_edges(self, image_path, low_threshold=50, high_threshold=150):
        """Extrahiert Canny Edges aus einem Bild"""
        
        # Bild laden
        if isinstance(image_path, str):
            img = cv2.imread(image_path)
        else:
            # Falls bereits numpy array
            img = image_path
            
        if img is None:
            raise ValueError("Bild konnte nicht geladen werden")
            
        # Zu Graustufen konvertieren
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Rauschen reduzieren
        blurred = cv2.GaussianBlur(gray, (5, 5), 1.5)
        
        # Canny Edge Detection
        edges = cv2.Canny(blurred, low_threshold, high_threshold)
        
        # Invertieren für bessere Sichtbarkeit
        edges_inv = cv2.bitwise_not(edges)
        
        return edges_inv
    
    def extract_colors(self, image_path, num_colors=5):
        """Extrahiert dominante Farben"""
        color_thief = ColorThief(image_path)
        palette = color_thief.get_palette(color_count=num_colors)
        
        # Hex-Farben konvertieren
        hex_colors = []
        for color in palette:
            hex_color = '#{:02x}{:02x}{:02x}'.format(color[0], color[1], color[2])
            hex_colors.append(hex_color)
            
        return hex_colors
    
    def estimate_lighting(self, img):
        """Schätzt die Beleuchtung basierend auf Histogramm"""
        # Zu HSV konvertieren
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Value (Helligkeit) Kanal
        v_channel = hsv[:,:,2]
        
        # Helligkeitsstatistiken
        mean_brightness = np.mean(v_channel)
        std_brightness = np.std(v_channel)
        
        # Beleuchtungstyp bestimmen
        if mean_brightness < 85:
            return "low_key"
        elif mean_brightness > 170:
            return "high_key"
        elif std_brightness < 30:
            return "flat"
        else:
            return "contrasty"
    
    def estimate_composition(self, img):
        """Schätzt grundlegende Komposition"""
        height, width = img.shape[:2]
        
        # Aspect Ratio
        aspect = width / height
        
        if aspect > 1.5:
            aspect_type = "panoramic"
        elif aspect < 0.7:
            aspect_type = "portrait"
        else:
            aspect_type = "square"
            
        return {
            "aspect_ratio": f"{width}:{height}",
            "type": aspect_type,
            "resolution": f"{width}x{height}"
        }
    
    def image_to_base64(self, image_array):
        """Konvertiert numpy array zu base64 PNG"""
        # BGR zu RGB konvertieren
        if len(image_array.shape) == 3 and image_array.shape[2] == 3:
            image_rgb = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image_array
            
        pil_img = Image.fromarray(image_rgb)
        buffered = io.BytesIO()
        pil_img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str
    
    def extract_uin_package(self, image_path, auto_threshold=True):
        """Hauptfunktion: Extrahiert vollständiges UIN Package"""
        
        print(f"Extrahiere UIN Package von: {image_path}")
        
        # Bild laden
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Konnte Bild nicht laden: {image_path}")
        
        # Automatische Threshold-Bestimmung
        if auto_threshold:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            mean_intensity = np.mean(gray)
            low = int(max(1, mean_intensity * 0.5))
            high = int(min(255, mean_intensity * 2))
            low = min(low, 100)
            high = max(high, low * 2)
        else:
            low, high = 50, 150
        
        # Canny Edges extrahieren
        edges = self.extract_edges(img, low, high)
        
        # Attribute extrahieren
        colors = self.extract_colors(image_path)
        lighting = self.estimate_lighting(img)
        composition = self.estimate_composition(img)
        
        # Base64 Kodierung der Edges
        edges_b64 = self.image_to_base64(edges)
        
        # UIN Package erstellen
        package = {
            "format": "uin-capsule-v1",
            "edges": edges_b64,
            "attributes": {
                "source_image": os.path.basename(image_path),
                "colors": colors,
                "lighting": lighting,
                "composition": composition,
                "canny_thresholds": {
                    "low": low,
                    "high": high
                },
                "extraction_timestamp": datetime.now().isoformat(),
                "version": self.version
            }
        }
        
        return package, edges

def main():
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Extrahiert UIN Package aus Bildern')
    parser.add_argument('image', help='Pfad zum Eingabebild')
    parser.add_argument('--output', '-o', help='Ausgabedatei (.uin)', default=None)
    parser.add_argument('--save-edges', '-e', help='Canny Edges als PNG speichern', action='store_true')
    
    args = parser.parse_args()
    
    try:
        extractor = UINReverseExtractor()
        package, edges = extractor.extract_uin_package(args.image)
        
        # Ausgabedatei bestimmen
        if args.output:
            output_file = args.output
        else:
            base_name = os.path.splitext(args.image)[0]
            output_file = f"{base_name}.uin"
        
        # UIN Package speichern
        with open(output_file, 'w') as f:
            json.dump(package, f, indent=2)
        print(f"✅ UIN Package gespeichert: {output_file}")
        print(f"   Größe: {os.path.getsize(output_file)} Bytes")
        
        # Canny Edges als PNG speichern
        if args.save_edges:
            edges_file = f"{os.path.splitext(output_file)[0]}_edges.png"
            cv2.imwrite(edges_file, edges)
            print(f"✅ Canny Edges gespeichert: {edges_file}")
            
            # Größenvergleich
            orig_size = os.path.getsize(args.image)
            edges_size = os.path.getsize(edges_file)
            reduction = (1 - edges_size/orig_size) * 100
            print(f"   Größenreduktion: {reduction:.1f}%")
        
        # Kurze Zusammenfassung
        print("\n📊 Extraktionsergebnis:")
        print(f"   Farben: {len(package['attributes']['colors'])} dominante Farben")
        print(f"   Beleuchtung: {package['attributes']['lighting']}")
        print(f"   Auflösung: {package['attributes']['composition']['resolution']}")
        print(f"   Canny Thresholds: {package['attributes']['canny_thresholds']}")
        
    except Exception as e:
        print(f"❌ Fehler: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
