# path: uin_ngin/benchmark/runner.py
from uin_ngin.benchmark.suite import BenchmarkSuite

def run_benchmark(fn):
    return BenchmarkSuite().run(fn)
