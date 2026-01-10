from pathlib import Path

def test_gui_file_exists_and_contains_form():
    p = Path(__file__).resolve().parents[2] / 'public' / 'gui.html'
    assert p.exists(), f"GUI demo not found at {p}"
    txt = p.read_text()
    assert '<textarea id="prompt"' in txt
    assert 'id="file"' in txt
    assert 'id="send"' in txt
