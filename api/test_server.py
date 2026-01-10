from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="UIN-NGIN Test API", version="0.7.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.7.0"}

@app.post("/api/import")
async def import_image(file: UploadFile = File(...)):
    try:
        # Mock analysis for testing
        mock_uin = {
            "version": "0.3",
            "metadata": {"description": "Generated from uploaded image"},
            "canvas": {"aspect_ratio": "16:9", "bounds": {"x": [-10,10], "y": [-10,10], "z": [-5,5]}},
            "objects": [
                {"id": "person1", "type": "human", "position": {"x": 0, "y": 0, "z": 0}},
                {"id": "tree1", "type": "tree", "position": {"x": 3, "y": 0, "z": 4}}
            ]
        }
        
        return JSONResponse({
            "success": True,
            "uin": mock_uin,
            "validation": {"valid": True, "errors": []},
            "features_extracted": {
                "edges": 150,
                "contours": 8,
                "colors": 12
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
