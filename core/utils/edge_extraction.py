# core/utils/edge_extraction.py
import cv2
import numpy as np
import json
from pathlib import Path
from PIL import Image  # falls nötig

def extract_canny_edges(image_path: Path, low_threshold: int = 100, high_threshold: int = 200):
    # (genau der Code aus altem extract_edges.py – copy-paste die Funktionen)
    # ...
    return edges, stats

def create_uin_package(image_path: Path, output_dir: Path, low_thresh: int = 100, high_thresh: int = 200):
    # (vollständiger Port – inkl. Preview, JSON, README)
    # ...
    return result_dict
