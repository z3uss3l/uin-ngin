import base64
import binascii
import json
import os
import tempfile
import logging
import uuid
from pathlib import Path

import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI()
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")
COMFYUI_TIMEOUT = float(os.getenv("COMFYUI_TIMEOUT", "30"))
logger = logging.getLogger("uin.comfyui_bridge")
if not logger.handlers:
    logging.basicConfig(level=getattr(logging, os.getenv("UIN_LOG_LEVEL", "INFO").upper(), logging.INFO))


class GenerateRequest(BaseModel):
    prompt: str = Field(min_length=1)
    depthMapBase64: str = Field(min_length=1)


def _decode_png_data_url(value: str) -> bytes:
    if not value.startswith("data:image/png;base64,"):
        raise ValueError("depthMapBase64 must be a PNG data URL")
    try:
        data = base64.b64decode(value.split(",", 1)[1], validate=True)
    except (ValueError, binascii.Error) as exc:
        raise ValueError("Invalid PNG base64 payload") from exc
    if not data:
        raise ValueError("Empty depth map")
    return data


@app.post("/api/generate")
def generate(req: GenerateRequest):
    request_id = str(uuid.uuid4())
    logger.info("generation.request request_id=%s", request_id)
    temp_path = None
    try:
        try:
            data = _decode_png_data_url(req.depthMapBase64)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tfile:
            tfile.write(data)
            temp_path = tfile.name

        logger.debug("generation.upload.start request_id=%s bytes=%d", request_id, len(data))
        with open(temp_path, "rb") as image_file:
            files = {"image": ("uin_depth_map.png", image_file, "image/png")}
            response = requests.post(
                f"{COMFYUI_URL}/upload/image",
                files=files,
                timeout=COMFYUI_TIMEOUT,
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"ComfyUI upload failed: {response.status_code}",
            )

        uploaded_name = response.json().get("name")
        if not uploaded_name:
            raise HTTPException(status_code=502, detail="ComfyUI returned no uploaded image name")

        workflow_path = Path(__file__).resolve().parent.parent / "workflows" / "comfyui-uin-basic.json"
        workflow = json.loads(workflow_path.read_text(encoding="utf-8"))
        if not workflow.get("6", {}).get("inputs") or not workflow.get("11", {}).get("inputs"):
            raise HTTPException(status_code=500, detail="Workflow is missing required nodes 6/11")

        workflow["6"]["inputs"]["text"] = req.prompt
        workflow["11"]["inputs"]["image"] = uploaded_name

        queue = requests.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": workflow},
            timeout=COMFYUI_TIMEOUT,
        )
        if queue.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"ComfyUI prompt failed: {queue.status_code}",
            )

        prompt_id = queue.json().get("prompt_id")
        logger.info("generation.queued request_id=%s prompt_id=%s", request_id, prompt_id)
        return {"success": True, "promptId": prompt_id}
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except FileNotFoundError:
                pass


@app.get("/api/health")
def health():
    return {"status": "ok"}
