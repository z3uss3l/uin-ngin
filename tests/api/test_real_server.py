import io
import numpy as np
import cv2
from fastapi.testclient import TestClient

from api.real_server import app


def test_real_import_endpoint_returns_v08_document():
    image = np.zeros((64, 96, 3), dtype=np.uint8)
    cv2.rectangle(image, (10, 10), (45, 45), (255, 255, 255), 2)
    ok, encoded = cv2.imencode(".png", image)
    assert ok

    client = TestClient(app)
    response = client.post(
        "/api/import",
        files={"file": ("test.png", io.BytesIO(encoded.tobytes()), "image/png")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["uin"]["version"] == "0.8"
    assert all("position" in obj for obj in body["uin"]["objects"])
