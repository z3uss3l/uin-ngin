# shim to expose top-level benchmark package under uin_ngin.benchmark
from benchmark import *
__all__ = getattr(__import__('benchmark'), '__all__', [])
