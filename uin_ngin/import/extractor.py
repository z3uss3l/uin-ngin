import cv2
import numpy as np
from typing import Dict, Any
import base64
from PIL import Image

class ImageExtractor:
    def __init__(self, max_width=2048, max_height=2048):
        self.max_width = max_width
        self.max_height = max_height
    
    def load_image(self, image_input) -> np.ndarray:
        if isinstance(image_input, str):
            if image_input.startswith("data:image"):
                return self._load_base64(image_input)
            else:
                return cv2.imread(image_input)
        elif isinstance(image_input, bytes):
            nparr = np.frombuffer(image_input, np.uint8)
            return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        else:
            raise ValueError("Unsupported image input type")
    
    def _load_base64(self, data_uri: str) -> np.ndarray:
        _, encoded = data_uri.split(",", 1)
        decoded = base64.b64decode(encoded)
        nparr = np.frombuffer(decoded, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    def extract_features(self, image_path) -> Dict[str, Any]:
        img = self.load_image(image_path)
        if img is None:
            raise ValueError(f"Could not load image")
        
        img = self._normalize_size(img)
        height, width = img.shape[:2]
        
        edges = self._extract_edges(img)
        contours = self._extract_contours(edges)
        colors = self._extract_color_regions(img)
        
        return {
            "metadata": {"width": width, "height": height, "channels": img.shape[2] if len(img.shape) > 2 else 1, "format": "BGR"},
            "edges": edges,
            "contours": contours,
            "colors": colors
        }
    
    def _normalize_size(self, img: np.ndarray) -> np.ndarray:
        height, width = img.shape[:2]
        if width > self.max_width or height > self.max_height:
            scale = min(self.max_width / width, self.max_height / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            img = cv2.resize(img, (new_width, new_height))
        return img
    
    def _extract_edges(self, img: np.ndarray) -> Dict:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_points = np.argwhere(edges > 0).tolist()
        return {"method": "canny", "threshold1": 50, "threshold2": 150, "point_count": len(edge_points), "points_sample": edge_points[:100]}
    
    def _extract_contours(self, edges: np.ndarray) -> Dict:
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contour_list = []
        for cnt in contours:
            if cv2.contourArea(cnt) > 50:
                contour_list.append({"area": float(cv2.contourArea(cnt)), "perimeter": float(cv2.arcLength(cnt, True)), "approx_vertices": len(cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True))})
        return {"count": len(contour_list), "contours": contour_list[:50]}
    
    def _extract_color_regions(self, img: np.ndarray) -> Dict:
        h, w = img.shape[:2]
        sample_points = [(h // 4, w // 4), (h // 2, w // 2), (3 * h // 4, 3 * w // 4)]
        colors = []
        for y, x in sample_points:
            b, g, r = img[y, x]
            colors.append({"position": [x, y], "rgb": [int(r), int(g), int(b)]})
        return {"sample_colors": colors, "has_alpha": False}
