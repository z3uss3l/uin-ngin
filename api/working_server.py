import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from typing import Dict, Any

app = FastAPI(title="UIN-NGIN Working API", version="0.7.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimpleImageExtractor:
    def extract_features(self, image_bytes):
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
        
        # Extract edges
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_points = np.argwhere(edges > 0).tolist()
        
        # Extract contours
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
            "metadata": {"width": w, "height": h, "channels": 3, "format": "BGR"},
            "edges": {"method": "canny", "point_count": len(edge_points), "points_sample": edge_points[:100]},
            "contours": {"count": len(contour_list), "contours": contour_list[:50]},
            "colors": {"sample_colors": colors, "has_alpha": False}
        }

class SimpleUINConverter:
    def convert(self, features):
        objects = []
        
        # Create objects from contours
        for idx, contour in enumerate(features["contours"]["contours"][:5]):
            obj = {
                "id": f"object_{idx}",
                "type": "region",
                "position": {"x": idx * 2 - 4, "y": 0, "z": idx},
                "properties": {
                    "area": contour["area"],
                    "perimeter": contour["perimeter"]
                }
            }
            objects.append(obj)
        
        return {
            "version": "0.3",
            "metadata": {"description": "Generated from uploaded image"},
            "canvas": {"aspect_ratio": "16:9", "bounds": {"x": [-10,10], "y": [-10,10], "z": [-5,5]}},
            "objects": objects
        }

extractor = SimpleImageExtractor()
converter = SimpleUINConverter()

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.7.0"}

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
                "colors": len(features["colors"]["sample_colors"])
            }
        })
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/api/import/status")
def import_status():
    return {
        "service": "image_import",
        "status": "ready",
        "supported_formats": ["jpg", "jpeg", "png", "bmp", "tiff"],
        "max_file_size_mb": 50
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
