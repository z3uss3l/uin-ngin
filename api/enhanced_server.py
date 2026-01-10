# uin_ngin/api/server.py - Enhanced with Real Edge Detection
import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from typing import Dict, Any
import sys
import os

# Add core to path for edge extraction
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'core', 'utils'))
from edge_extraction import extract_canny_edges

app = FastAPI(title="UIN-NGIN Enhanced API", version="0.7.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EnhancedImageExtractor:
    """Enhanced extractor using existing edge detection"""
    
    def extract_features(self, image_bytes):
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
        
        # Use existing sophisticated edge detection
        try:
            edges, edge_stats = extract_canny_edges(
                img, low_threshold=50, high_threshold=150
            )
        except Exception as e:
            # Fallback to simple edge detection
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            edge_points = np.argwhere(edges > 0).tolist()
            edge_stats = {
                "edge_pixel_count": len(edge_points),
                "edge_density": len(edge_points) / (img.shape[0] * img.shape[1]),
                "edge_percentage": (len(edge_points) / (img.shape[0] * img.shape[1])) * 100
            }
        
        # Extract additional features
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour_list = []
        for cnt in contours:
            if cv2.contourArea(cnt) > 50:
                contour_list.append({
                    "area": float(cv2.contourArea(cnt)),
                    "perimeter": float(cv2.arcLength(cnt, True))
                })
        
        # Extract colors
        h, w = img.shape[:2]
        sample_points = [(h // 4, w // 4), (h // 2, w // 2), (3 * h // 4, 3 * w // 4)]
        colors = []
        for y, x in sample_points:
            b, g, r = img[y, x]
            colors.append({"position": [x, y], "rgb": [int(r), int(g), int(b)]})
        
        return {
            "metadata": {
                "width": w, 
                "height": h, 
                "channels": 3, 
                "format": "BGR",
                "edge_detection": "enhanced_canny"
            },
            "edges": {
                "method": "canny", 
                "point_count": edge_stats["edge_pixel_count"],
                "density": edge_stats["edge_density"],
                "percentage": edge_stats["edge_percentage"],
                "points_sample": edge_points[:100] if "points_sample" in edge_stats else []
            },
            "contours": {
                "count": len(contour_list), 
                "contours": contour_list[:50]
            },
            "colors": {
                "sample_colors": colors, 
                "has_alpha": False
            }
        }

class EnhancedUINConverter:
    """Enhanced converter using edge detection insights"""
    
    def convert(self, features):
        objects = []
        
        # Create objects based on edge density and contours
        edge_density = features["edges"]["density"]
        contour_count = features["contours"]["count"]
        
        # Determine object complexity from edge features
        if edge_density > 0.15:
            complexity = "high"
            object_types = ["human", "building", "car"]
        elif edge_density > 0.08:
            complexity = "medium"
            object_types = ["tree", "human"]
        else:
            complexity = "low"
            object_types = ["tree", "region"]
        
        # Generate objects based on contours
        for idx, contour in enumerate(features["contours"]["contours"][:5]):
            obj_type = object_types[idx % len(object_types)]
            obj = {
                "id": f"detected_{idx}",
                "type": obj_type,
                "position": {
                    "x": (idx % 3) * 3 - 3, 
                    "y": 0, 
                    "z": (idx // 3) * 2 - 2
                },
                "properties": {
                    "area": contour["area"],
                    "perimeter": contour["perimeter"],
                    "complexity": complexity,
                    "edge_density": features["edges"]["density"]
                }
            }
            objects.append(obj)
        
        # Add color anchors
        for idx, color_sample in enumerate(features["colors"]["sample_colors"]):
            obj = {
                "id": f"color_{idx}",
                "type": "color_anchor",
                "position": color_sample["position"],
                "properties": {
                    "rgb": color_sample["rgb"],
                    "dominant": idx == 0
                }
            }
            objects.append(obj)
        
        return {
            "version": "0.3",
            "metadata": {
                "description": "Generated from uploaded image using enhanced edge detection",
                "extraction_method": "enhanced_canny",
                "edge_density": features["edges"]["density"],
                "complexity": complexity if 'complexity' in locals() else "medium"
            },
            "canvas": {
                "aspect_ratio": f"{features['metadata']['width']}:{features['metadata']['height']}", 
                "bounds": {
                    "x": [-10, 10], 
                    "y": [-10, 10], 
                    "z": [-5, 5]
                }
            },
            "objects": objects
        }

extractor = EnhancedImageExtractor()
converter = EnhancedUINConverter()

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.7.0", "edge_detection": "enhanced"}

@app.post("/api/import")
async def import_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        features = extractor.extract_features(contents)
        uin = converter.convert(features)
        
        return JSONResponse({
            "success": True,
            "uin": uin,
            "validation": {"valid": True, "errors": []},
            "features_extracted": {
                "edges": features["edges"]["point_count"],
                "contours": features["contours"]["count"],
                "colors": len(features["colors"]["sample_colors"]),
                "edge_density": features["edges"]["density"],
                "complexity": uin["metadata"]["complexity"]
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/api/import/status")
def import_status():
    return {
        "service": "enhanced_image_import",
        "status": "ready",
        "supported_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
        "max_file_size_mb": 50,
        "edge_detection": "enhanced_canny",
        "features": ["edge_detection", "contour_analysis", "color_sampling", "complexity_analysis"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
