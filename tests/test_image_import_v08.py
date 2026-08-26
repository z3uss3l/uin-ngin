from jsonschema import Draft7Validator
import numpy as np
import cv2

from uin_ngin.image_import.extractor import ImageExtractor
from uin_ngin.image_import.converter import FeatureToUINConverter


def test_image_import_produces_schema_conformant_uin():
    image = np.zeros((64, 96, 3), dtype=np.uint8)
    cv2.rectangle(image, (10, 10), (45, 45), (255, 255, 255), 2)
    ok, encoded = cv2.imencode(".png", image)
    assert ok

    features = ImageExtractor(max_width=96, max_height=64).extract_features(encoded.tobytes())
    doc = FeatureToUINConverter().convert(features)

    import json
    from pathlib import Path
    schema = json.loads(Path("docs/UINspecificationSchemaV08.json").read_text())
    errors = list(Draft7Validator(schema).iter_errors(doc))
    assert not errors, [e.message for e in errors]
    assert all("position" in obj for obj in doc["objects"])
