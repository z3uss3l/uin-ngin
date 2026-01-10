from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import base64
import requests
import tempfile
import os
from pathlib import Path

app = FastAPI()
COMFYUI_URL = "http://127.0.0.1:8188"

class GenerateRequest(BaseModel):
    prompt: str
    depthMapBase64: str

@app.post("/api/generate")
def generate(req: GenerateRequest):
    try:
        # save depth map to temp file
        header, b64 = req.depthMapBase64.split(',', 1) if ',' in req.depthMapBase64 else (None, req.depthMapBase64)
        data = base64.b64decode(b64)
        tfile = tempfile.NamedTemporaryFile(delete=False, suffix='.png')
        tfile.write(data)
        tfile.flush()
        tfile.close()

        # upload to ComfyUI
        files = {'image': ('uin_depth_map.png', open(tfile.name, 'rb'), 'image/png')}
        r = requests.post(f"{COMFYUI_URL}/upload/image", files=files, timeout=10)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"ComfyUI upload failed: {r.status_code}")
        uploaded_name = r.json().get('name')

        # load workflow (from repo)
        wf_path = Path(__file__).resolve().parent.parent / 'workflows' / 'comfyui-uin-basic.json'
        import json
        wf = json.loads(wf_path.read_text())
        wf["6"]["inputs"]["text"] = req.prompt
        wf["11"]["inputs"]["image"] = uploaded_name

        q = requests.post(f"{COMFYUI_URL}/prompt", json={"prompt": wf}, timeout=10)
        if q.status_code != 200:
            raise HTTPException(status_code=502, detail=f"ComfyUI prompt failed: {q.status_code}")

        return {"success": True, "promptId": q.json().get('prompt_id')}
    finally:
        try:
            os.unlink(tfile.name)
        except Exception:
            pass

@app.get('/api/health')
def health():
    return {'status': 'ok'}
