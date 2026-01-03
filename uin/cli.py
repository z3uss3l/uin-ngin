# path: uin/cli.py
import argparse
from uin.utils.io import read_stdin, write_stdout
from uin.pipeline.context import PipelineContext
from uin.pipeline.steps import (
    step_import,
    step_normalize,
    step_validate,
    step_export,
)


def main() -> None:
    parser = argparse.ArgumentParser(prog="uin")
    parser.add_argument(
        "command",
        choices=["import", "normalize", "validate", "export"],
    )
    args = parser.parse_args()

    raw = read_stdin()
    ctx = PipelineContext()

    if args.command == "import":
        ctx = step_import(ctx, raw)
        write_stdout(raw)

    elif args.command == "normalize":
        ctx = step_import(ctx, raw)
        ctx = step_normalize(ctx)
        write_stdout(step_export(ctx))

    elif args.command == "validate":
        ctx = step_import(ctx, raw)
        step_validate(ctx)
        write_stdout(raw)

    elif args.command == "export":
        ctx = step_import(ctx, raw)
        write_stdout(step_export(ctx))


if __name__ == "__main__":
    main()
