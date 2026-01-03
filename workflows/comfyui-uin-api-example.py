import json
import requests
from pathlib import Path

COMFYUI_URL = "http://127.0.0.1:8188"

def upload_image(image_path):
    """Upload depth map to ComfyUI"""
    with open(image_path, 'rb') as f:
        files = {'image': ('uin_depth_map.png', f, 'image/png')}
        response = requests.post(f"{COMFYUI_URL}/upload/image", files=files)
    
    if response.status_code == 200:
        return response.json()['name']
    else:
        raise Exception(f"Upload failed: {response.text}")

def queue_prompt(prompt_text, depth_map_path, workflow_path="workflows/comfyui-uin-basic.json"):
    """Queue generation with UIN prompt and depth map"""
    
    # 1. Upload depth map
    print("📤 Uploading depth map...")
    uploaded_name = upload_image(depth_map_path)
    print(f"✅ Uploaded as: {uploaded_name}")
    
    # 2. Load and modify workflow
    with open(workflow_path, 'r') as f:
        workflow = json.load(f)
    
    # 3. Set prompt and image
    workflow["6"]["inputs"]["text"] = prompt_text
    workflow["11"]["inputs"]["image"] = uploaded_name
    
    # 4. Queue prompt
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

if __name__ == "__main__":
    # Example usage
    prompt = "golden hour lighting, young woman with long red hair, blue eyes, photorealistic, cinematic"
    depth_map = "uin_depth_map.png"  # Download from React tool first!
    
    try:
        result = queue_prompt(prompt, depth_map)
        print("\n🎉 Check ComfyUI interface for results!")
    except Exception as e:
        print(f"❌ Error: {e}")
