from typing import Dict, Any, List
from datetime import datetime

class FeatureToUINConverter:
    def __init__(self):
        self.uin_version = "0.8"
    
    def convert(self, features: Dict[str, Any]) -> Dict[str, Any]:
        metadata = features["metadata"]
        
        uin = {
            "version": self.uin_version,
            "created": datetime.now().isoformat(),
            "source": "import_engine",
            "scene": {
                "name": "imported_scene",
                "canvas": {"width": metadata["width"], "height": metadata["height"], "unit": "pixel"},
                "objects": self._create_objects_from_features(features),
                "camera": {"type": "orthographic", "position": [0, 0, 0], "viewport": {"width": metadata["width"], "height": metadata["height"]}}
            },
            "metadata": {"source_type": "image", "detected_features": {"edges": features["edges"]["point_count"], "contours": features["contours"]["count"], "colors": len(features["colors"]["sample_colors"])}}
        }
        return uin
    
    def _create_objects_from_features(self, features: Dict) -> List[Dict]:
        objects = []
        for idx, contour in enumerate(features["contours"]["contours"][:5]):
            obj = {"id": f"contour_{idx}", "type": "region", "name": f"Region {idx}", "properties": {"area": contour["area"], "perimeter": contour["perimeter"], "shape_complexity": contour["approx_vertices"]}}
            objects.append(obj)
        for idx, color_sample in enumerate(features["colors"]["sample_colors"]):
            obj = {"id": f"color_{idx}", "type": "color_anchor", "position": color_sample["position"], "properties": {"rgb": color_sample["rgb"]}}
            objects.append(obj)
        return objects
