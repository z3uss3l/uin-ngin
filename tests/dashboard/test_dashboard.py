# path: tests/dashboard/test_dashboard.py
from fastapi.testclient import TestClient
from uin.dashboard.routes import app

client = TestClient(app)

def test_metrics_endpoint():
    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert isinstance(resp.json(), dict)

def test_record_metric():
    resp = client.post("/record/test_metric", json=5.0)
    assert resp.status_code == 200
    resp2 = client.get("/metrics")
    assert "test_metric" in resp2.json()
