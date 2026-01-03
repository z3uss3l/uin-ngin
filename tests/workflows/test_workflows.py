import json
from pathlib import Path


def test_comfyui_workflow_structure():
    p = Path(__file__).parent.parent / 'workflows' / 'comfyui-uin-basic.json'
    assert p.exists(), f"Workflow JSON not found at {p}"

    data = json.loads(p.read_text())
    # Check nodes exist
    assert "6" in data, "Node 6 (prompt) missing"
    assert "11" in data, "Node 11 (image) missing"

    assert data["6"].get("class_type") == "CLIPTextEncode"
    assert data["11"].get("class_type") == "LoadImage"
