# path: uin/utils/io.py
import sys


def read_stdin() -> str:
    return sys.stdin.read()


def write_stdout(data: str) -> None:
    sys.stdout.write(data)
