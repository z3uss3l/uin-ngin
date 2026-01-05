import argparse
from pathlib import Path
import sys

def main():
    parser = argparse.ArgumentParser(
        prog="uin",
        description="UIN-NGIN CLI (Phase-1 bootstrapped)"
    )

    subparsers = parser.add_subparsers(dest="command")

    extract = subparsers.add_parser("extract", help="Placeholder extract command")
    extract.add_argument("image", type=Path)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(0)

    if args.command == "extract":
        print(f"[uin] extract called with image={args.image}")
        sys.exit(0)


if __name__ == "__main__":
    main()
