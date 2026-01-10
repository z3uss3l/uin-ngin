import json
from fastapi.testclient import TestClient
from server import comfyui_bridge_py as bridge
import requests

class DummyResponse:
    def __init__(self, status_code=200, data=None):
        self.status_code = status_code
        self._data = data or {}
    def json(self):
        return self._data

class DummyFile:
    def __init__(self):
        pass


def fake_post(url, *args, **kwargs):
    if url.endswith('/upload/image'):
        return DummyResponse(200, {'name': 'uploaded.png'})
    if url.endswith('/prompt'):
        return DummyResponse(200, {'prompt_id': 'abc123'})
    return DummyResponse(500, {})


def test_generate(monkeypatch):
    client = TestClient(bridge.app)

    monkeypatch.setattr('requests.post', fake_post)

    # 1x1 transparent PNG base64
    payload = {
        'prompt': 'a prompt',
        'depthMapBase64': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
    }

    resp = client.post('/api/generate', json=payload)
    assert resp.status_code == 200
    assert resp.json().get('success') is True
    assert resp.json().get('promptId') == 'abc123'
