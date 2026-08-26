from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_active_ui_does_not_disable_validation():
    for path in [ROOT / "packages/uin-ui/src/App.jsx", ROOT / "src/App.jsx"]:
        if path.exists():
            assert "validate: false" not in path.read_text(encoding="utf-8")

