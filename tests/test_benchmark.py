# path: tests/test_benchmark.py
from uin_ngin.benchmark.runner import run_benchmark

def test_benchmark():
    r = run_benchmark(lambda: sum(range(1000)))
    assert r["duration"] >= 0
