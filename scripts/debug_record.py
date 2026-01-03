import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from fastapi.testclient import TestClient
from uin.dashboard.routes import app

client = TestClient(app)
resp = client.post('/record/test_metric', json=5.0)
print('status', resp.status_code)
print('json', resp.json())
print('text', resp.text)
print('headers', resp.headers)
