# path: tests/cli/test_pipeline.py
import subprocess
import json
import sys


def test_cli_normalize(tmp_path):
    doc = {
        "meta": {},
        "shapes": [
            {
                "id": "x",
                "type": "rect",
                "x": 0,
                "y": 0,
                "width": 1,
                "height": 1,
                "color": {"r": 0, "g": 0, "b": 0, "a": 1.0},
            }
        ],
    }

    p = subprocess.run(
        [sys.executable, "-m", "uin.cli", "normalize"],
        input=json.dumps(doc),
        text=True,
        capture_output=True,
    )

    assert p.returncode == 0
    out = json.loads(p.stdout)
    assert out["shapes"][0]["id"] == "x"
