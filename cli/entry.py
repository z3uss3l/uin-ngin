# cli/entry.py
import argparse
from core.utils.edge_extraction import create_uin_package
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("-o", "--output", default="./uin_output")
    args = parser.parse_args()
    create_uin_package(Path(args.input), Path(args.output))
    print("UIN-Paket erstellt!")

if __name__ == "__main__":
    main()
