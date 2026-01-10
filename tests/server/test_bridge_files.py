from pathlib import Path


def test_bridge_files_exist_and_contain_endpoints():
    root = Path(__file__).parent.parent.parent
    bridge = root / 'server' / 'comfyui-bridge.js'
    pkg = root / 'server' / 'package.json'

    assert bridge.exists(), "Bridge server file missing"
    assert pkg.exists(), "Bridge package.json missing"

    text = bridge.read_text(encoding='utf-8')
    assert '/api/generate' in text
    assert '/api/health' in text
