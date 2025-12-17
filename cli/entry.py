# path: uin_ngin/cli/entry.py
import argparse
from uin_ngin.main import run

def main():
    p = argparse.ArgumentParser("uin-ngin")
    p.add_argument("--config")
    p.add_argument("mode", choices=["cli","api","benchmark"])
    args = p.parse_args()
    run(args)
