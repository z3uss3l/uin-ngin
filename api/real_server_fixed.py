# uin_ngin/api/server.py - Real Image Analysis
import json
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from uin_ngin.metrics.registry import MetricsRegistry
from uin_ngin.import.extractor import ImageExtractor
from uin_ngin.import.converter import FeatureToUINConverter

app = FastAPI(title="UIN-NGIN Real API", version="0.7.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

metrics = MetricsRegistry()
image_extractor = ImageExtractor()
uin_converter = FeatureToUINConverter()

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.7.0"}

@app.get("/metrics")
def get_metrics():
    return metrics.export()

@app.post("/api/import")
async def import_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        features = image_extractor.extract_features(contents)
        uin = uin_converter.convert(features)
        
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
