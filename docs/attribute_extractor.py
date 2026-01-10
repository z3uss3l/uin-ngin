#!/usr/bin/env python3
"""
BLIP-basierte Attribut-Extraktion für UIN
"""

import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
import cv2
import numpy as np
import json
from typing import List, Dict, Any
import os

class UINAttributeExtractor:
    def __init__(self, device=None):
        """Initialisiert BLIP Model für Bildbeschreibung"""
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        
        print(f"Lade BLIP Model auf {self.device}...")
        self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.model = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        ).to(self.device)
        
        print("BLIP Model geladen ✓")
    
    def generate_caption(self, image_path: str, max_length: int = 50) -> str:
        """Generiert Bildbeschreibung mit BLIP"""
        
        # Bild laden und vorverarbeiten
        raw_image = Image.open(image_path).convert('RGB')
        
        # BLIP Input vorbereiten
        inputs = self.processor(raw_image, return_tensors="pt").to(self.device)
        
        # Caption generieren
        with torch.no_grad():
            out = self.model.generate(**inputs, max_length=max_length)
        
        caption = self.processor.decode(out[0], skip_special_tokens=True)
        return caption
    
    def extract_detailed_attributes(self, image_path: str) -> Dict[str, Any]:
        """Extrahiert detaillierte Attribute aus Bild"""
        
        # Grundlegende Metadaten
        img = Image.open(image_path)
        width, height = img.size
        mode = img.mode
        format_type = img.format
        
        # BLIP Caption
        caption = self.generate_caption(image_path)
        
        # OpenCV für weitere Analysen
        cv_img = cv2.imread(image_path)
        
        # Farbanalyse
        colors = self._analyze_colors(cv_img)
        
        # Helligkeitsanalyse
        brightness = self._analyze_brightness(cv_img)
        
        # Kantendichte (Schätzung für Detailgrad)
        edge_density = self._analyze_edge_density(cv_img)
        
        # Bildtyp-Klassifikation (einfache Heuristik)
        image_type = self._classify_image_type(cv_img)
        
        return {
            "basic_metadata": {
                "dimensions": f"{width}x{height}",
                "aspect_ratio": f"{width}:{height}",
                "color_mode": mode,
                "format": format_type
            },
            "caption": caption,
            "colors": colors,
            "brightness": brightness,
            "characteristics": {
                "edge_density": edge_density,
                "image_type": image_type,
                "estimated_quality": self._estimate_quality(cv_img)
            }
        }
    
    def _analyze_colors(self, img: np.ndarray) -> Dict:
        """Analysiert Farbverteilung"""
        # Zu HSV konvertieren
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        
        # Hue-Verteilung analysieren
        hue = hsv[:,:,0]
        hist_hue = cv2.calcHist([hue], [0], None, [12], [0, 180])
        hist_hue = hist_hue.flatten() / hist_hue.sum()
        
        # Dominante Farben finden
        unique_colors, counts = np.unique(
            img.reshape(-1, 3), axis=0, return_counts=True
        )
        top_colors = unique_colors[counts.argsort()[-3:]][::-1]
        
        return {
            "hue_distribution": hist_hue.tolist(),
            "dominant_rgb": top_colors.tolist(),
            "saturation_mean": float(hsv[:,:,1].mean()),
            "value_mean": float(hsv[:,:,2].mean())
        }
    
    def _analyze_brightness(self, img: np.ndarray) -> Dict:
        """Analysiert Helligkeitsverteilung"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        mean = float(gray.mean())
        std = float(gray.std())
        hist = cv2.calcHist([gray], [0], None, [8], [0, 256])
        hist = hist.flatten() / hist.sum()
        
        # Beleuchtungsklassifikation
        if mean < 85:
            lighting = "dark"
        elif mean < 170:
            lighting = "medium"
        else:
            lighting = "bright"
            
        return {
            "mean": mean,
            "std": std,
            "histogram": hist.tolist(),
            "lighting_class": lighting
        }
    
    def _analyze_edge_density(self, img: np.ndarray) -> float:
        """Berechnet Kantendichte als Maß für Detailgrad"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 100, 200)
        density = np.sum(edges > 0) / edges.size
        return float(density)
    
    def _classify_image_type(self, img: np.ndarray) -> str:
        """Klassifiziert Bildtyp basierend auf Merkmalen"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Kantendichte
        edge_density = self._analyze_edge_density(img)
        
        # Farbvarianz
        color_std = float(img.std())
        
        # Einfache Heuristiken
        if edge_density > 0.15 and color_std > 40:
            return "detailed_photograph"
        elif edge_density < 0.05:
            return "minimalistic"
        elif color_std < 20:
            return "low_contrast"
        else:
            return "general"
    
    def _estimate_quality(self, img: np.ndarray) -> str:
        """Schätzt Bildqualität (sehr einfache Heuristik)"""
        # Schärfe über Laplacian Variance
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if laplacian_var > 100:
            return "sharp"
        elif laplacian_var > 50:
            return "medium"
        else:
            return "soft/blurry"

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Extrahiert Bildattribute mit BLIP')
    parser.add_argument('image', help='Pfad zum Bild')
    parser.add_argument('--output', '-o', help='Ausgabedatei (.json)')
    
    args = parser.parse_args()
    
    try:
        extractor = UINAttributeExtractor()
        
        print(f"Analysiere Bild: {args.image}")
        attributes = extractor.extract_detailed_attributes(args.image)
        
        # Ausgabe
        if args.output:
            output_file = args.output
        else:
            base_name = os.path.splitext(args.image)[0]
            output_file = f"{base_name}_attributes.json"
        
        with open(output_file, 'w') as f:
            json.dump(attributes, f, indent=2)
        
        print(f"✅ Attribute gespeichert in: {output_file}")
        print(f"\n📝 Generierte Caption: {attributes['caption']}")
        print(f"📐 Dimensionen: {attributes['basic_metadata']['dimensions']}")
        print(f"💡 Beleuchtung: {attributes['brightness']['lighting_class']}")
        print(f"🎨 Bildtyp: {attributes['characteristics']['image_type']}")
        
    except Exception as e:
        print(f"❌ Fehler: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
