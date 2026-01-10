import json
import requests
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"

def upload_image(image_path):
    with open(image_path, 'rb') as f:
        files = {'image': ('uin_depth_map.png', f, 'image/png')}
        response = requests.post(f"{COMFYUI_URL}/upload/image", files=files)
    
    if response.status_code == 200:
        return response.json()['name']
    else:
        raise Exception(f"Upload failed: {response.text}")

def queue_prompt(prompt_text, depth_map_path, workflow_path="workflows/comfyui-uin-basic.json"):
    print("📤 Uploading depth map...")
    uploaded_name = upload_image(depth_map_path)
    print(f"✅ Uploaded as: {uploaded_name}")
    
    with open(workflow_path, 'r') as f:
        workflow = json.load(f)
    
    workflow["6"]["inputs"]["text"] = prompt_text
    workflow["11"]["inputs"]["image"] = uploaded_name
    
    print("🎨 Queuing generation...")
    response = requests.post(
        f"{COMFYUI_URL}/prompt",
        json={"prompt": workflow}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Generation started! Prompt ID: {result['prompt_id']}")
        return result
    else:
        raise Exception(f"Queue failed: {response.text}")
