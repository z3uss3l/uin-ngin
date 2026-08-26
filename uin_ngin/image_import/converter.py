from typing import Dict, Any, List
from datetime import datetime, timezone


class FeatureToUINConverter:
    """Convert image-extraction features into a UIN v0.8 document."""

    def __init__(self):
        self.uin_version = "0.8"

    def convert(self, features: Dict[str, Any]) -> Dict[str, Any]:
        metadata = features["metadata"]
        width = int(metadata["width"])
        height = int(metadata["height"])
        objects = self._create_objects_from_features(features)

        return {
            "version": self.uin_version,
            "metadata": {
                "title": "Imported image scene",
                "description": "Generated from image feature extraction.",
                "created": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                "conformance": "UIN-Core-0.8",
                "tags": ["import", "image-analysis"],
            },
            "canvas": {
                "aspect_ratio": f"{width}:{height}",
                "bounds": {"x": [0, width], "y": [0, height], "z": [0, 0]},
                "coordinate_system": "pixel_absolute",
            },
            "objects": objects,
        }

    def _create_objects_from_features(self, features: Dict[str, Any]) -> List[Dict[str, Any]]:
        objects: List[Dict[str, Any]] = []
        for idx, contour in enumerate(features["contours"]["contours"][:50]):
            cx, cy = contour.get("centroid", [0, 0])
            objects.append({
                "id": f"contour_{idx}",
                "type": "region",
                "name": f"Region {idx + 1}",
                "position": {"x": float(cx), "y": float(cy), "z": 0.0},
                "properties": {
                    "area": contour["area"],
                    "perimeter": contour["perimeter"],
                    "shape_complexity": contour["approx_vertices"],
                },
            })

        for idx, color_sample in enumerate(features["colors"]["sample_colors"]):
            x, y = color_sample["position"]
            r, g, b = color_sample["rgb"]
            objects.append({
                "id": f"color_{idx}",
                "type": "color_anchor",
                "name": f"Color anchor {idx + 1}",
                "position": {"x": float(x), "y": float(y), "z": 0.0},
                "features": {"color": {"r": r, "g": g, "b": b}},
                "properties": {"rgb": [r, g, b]},
            })

        return objects
