import importlib.util
from types import SimpleNamespace
from pathlib import Path


def load_module_from_path(pth):
    spec = importlib.util.spec_from_file_location("comfyui_api_example", str(pth))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def test_queue_prompt_handles_unreachable_comfyui(tmp_path, monkeypatch):
    p = Path(__file__).parent.parent / 'workflows' / 'comfyui-uin-api-example.py'
    mod = load_module_from_path(p)

    # Prepare a dummy depth map file
    depth = tmp_path / 'uin_depth_map.png'
    depth.write_bytes(b"PNGDATA")

    # Monkeypatch requests.post to simulate upload failure
    def fake_post(url, *args, **kwargs):
        class Resp:
            def __init__(self):
                self.status_code = 500
                self.text = 'Server error'
            def json(self):
                return {}
        return Resp()

    monkeypatch.setattr("requests.post", fake_post)

    try:
        mod.queue_prompt("test prompt", str(depth))
        raised = False
    except Exception:
        raised = True

    assert raised, "queue_prompt should raise when ComfyUI is unreachable or returns error"
