# path: uin_ngin/benchmark/suite.py
import time

class BenchmarkResult(dict): pass

class BenchmarkSuite:
    def run(self, fn):
        start = time.perf_counter()
        fn()
        return BenchmarkResult(duration=time.perf_counter()-start)
