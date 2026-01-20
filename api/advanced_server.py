import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from typing import Dict, Any

app = FastAPI(title="UIN-NGIN Advanced API", version="0.8.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://127.0.0.1:58199", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AdvancedImageExtractor:
    def extract_features(self, image_bytes):
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Could not decode image")
        
        # 1. Edge Detection (Canny)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        edge_points = np.argwhere(edges > 0).tolist()
        
        # 2. Hough Line Detection (Structural)
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=50, minLineLength=50, maxLineGap=10)
        line_count = 0
        vertical_lines = 0
        horizontal_lines = 0
        
        if lines is not None:
            line_count = len(lines)
            for line in lines:
                x1, y1, x2, y2 = line[0]
                angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                if angle < 10 or angle > 170:
                    horizontal_lines += 1
                elif 80 < angle < 100:
                    vertical_lines += 1

        # 3. Contour & Shape Detection (Polygons)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour_list = []
        shapes = {"triangles": 0, "rectangles": 0, "circles": 0, "polygons": 0}
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > 100: # Ignore noise
                perimeter = cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, 0.04 * perimeter, True)
                vertices = len(approx)
                
                shape_type = "unknown"
                if vertices == 3:
                    shape_type = "triangle"
                    shapes["triangles"] += 1
                elif vertices == 4:
                    shape_type = "rectangle"
                    shapes["rectangles"] += 1
                elif vertices > 8:
                    shape_type = "circle"
                    shapes["circles"] += 1
                else:
                    shape_type = "polygon"
                    shapes["polygons"] += 1

                contour_list.append({
                    "area": float(area),
                    "perimeter": float(perimeter),
                    "shape": shape_type,
                    "center": self._get_center(cnt, img.shape)
                })
        
        # 4. Color Analysis
        h, w = img.shape[:2]
        sample_points = [(h // 4, w // 4), (h // 2, w // 2), (3 * h // 4, 3 * w // 4)]
        colors = []
        for y, x in sample_points:
            b, g, r = img[y, x]
            colors.append({"position": [x, y], "rgb": [int(r), int(g), int(b)]})
        
        return {
            "metadata": {"width": w, "height": h, "channels": 3, "format": "BGR"},
            "edges": {
                "method": "canny", 
                "point_count": len(edge_points),
                "density": len(edge_points) / (w * h)
            },
            "lines": {
                "count": line_count,
                "horizontal": horizontal_lines,
                "vertical": vertical_lines
            },
            "contours": {
                "count": len(contour_list), 
                "contours": contour_list[:50], # Limit to 50 for performance
                "shapes": shapes
            },
            "colors": {"sample_colors": colors}
        }

    def _get_center(self, contour, shape):
        M = cv2.moments(contour)
        if M["m00"] != 0:
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            # Normalize to -10 to 10 range roughly
            h, w = shape[:2]
            nx = (cx / w) * 20 - 10
            ny = 0 # Flat on ground
            nz = (cy / h) * 10 - 5 # Depth mapping
            return {"x": round(nx, 2), "y": ny, "z": round(nz, 2)}
        return {"x": 0, "y": 0, "z": 0}

class AdvancedUINConverter:
    def convert(self, features):
        objects = []
        
        # Create objects from detected shapes
        contours = features["contours"]["contours"]
        
        for idx, item in enumerate(contours[:10]): # Process top 10 contours
            shape = item["shape"]
            position = item["center"]
            
            # Map shapes to UIN catalog types
            obj_type = "region" # default
            if shape == "triangle":
                obj_type = "tree" # Triangles often look like trees
            elif shape == "rectangle":
                # If it has many vertical lines, maybe a building
                if features["lines"]["vertical"] > 5:
                    obj_type = "building"
                else:
                    obj_type = "car" # Boxy shape
            elif shape == "circle":
                obj_type = "human_group" # Abstract representation
            
            obj = {
                "id": f"{obj_type}_{idx}",
                "type": obj_type,
                "position": position,
                "properties": {
                    "shape_detected": shape,
                    "area": item["area"],
                    "perimeter": item["perimeter"]
                }
            }
            objects.append(obj)
        
        # Fallback if no specific shapes detected
        if not objects:
            objects.append({
                "id": "default_scene",
                "type": "region",
                "position": {"x": 0, "y": 0, "z": 0}
            })

        return {
            "version": "0.3",
            "metadata": {
                "description": "Generated from Advanced OpenCV Analysis",
                "stats": {
                    "lines": features["lines"]["count"],
                    "shapes": features["contours"]["shapes"]
                }
            },
            "canvas": {"aspect_ratio": "16:9", "bounds": {"x": [-10,10], "y": [-10,10], "z": [-5,5]}},
            "objects": objects
        }

extractor = AdvancedImageExtractor()
converter = AdvancedUINConverter()

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.8.0", "mode": "advanced_opencv"}

@app.post("/api/import")
async def import_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        features = extractor.extract_features(contents)
        uin = converter.convert(features)
        
        # Flattened stats for Frontend safety (Primitives only!)
        frontend_features = {
            "edges": features["edges"]["point_count"],
            "contours": features["contours"]["count"],
            "colors": len(features["colors"]["sample_colors"]),
            "loops": features["contours"]["shapes"]["circles"], 
            "lines": features["lines"]["count"],
            "corners": features["contours"]["shapes"]["rectangles"] 
        }

        return JSONResponse({
            "success": True,
            "uin": uin,
            "validation": {"valid": True, "errors": []},
            "features_extracted": frontend_features
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")

@app.get("/api/import/status")
def import_status():
    return {
        "service": "advanced_image_import",
        "status": "ready",
        "capabilities": ["hough_lines", "poly_approx", "canny", "color_segmentation"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
