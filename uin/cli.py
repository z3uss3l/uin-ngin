# path: uin/cli.py
import argparse
import os
from uin.utils.io import read_stdin, write_stdout
from uin.pipeline.context import PipelineContext
from uin.utils.logging import configure_logging, get_logger, log_event

logger = get_logger("cli")

from uin.pipeline.steps import (
    step_import,
    step_normalize,
    step_validate,
    step_export,
)


def main() -> None:
    configure_logging()
    log_event(logger, 20, "cli.start", "UIN CLI started")
    parser = argparse.ArgumentParser(prog="uin")
    parser.add_argument("--log-level", choices=["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"], help="Set UIN logging level")
    parser.add_argument("--log-format", choices=["text", "json"], help="Set UIN logging format")
    parser.add_argument(
        "command",
        choices=["import", "normalize", "validate", "export"],
    )
    args = parser.parse_args()
    if args.log_level:
        os.environ["UIN_LOG_LEVEL"] = args.log_level
    if args.log_format:
        os.environ["UIN_LOG_FORMAT"] = args.log_format
    # Logging is configured after CLI overrides are applied.
    configure_logging()

    raw = read_stdin()
    log_event(logger, 10, "cli.input", "Read stdin payload", bytes=len(raw.encode("utf-8")))
    ctx = PipelineContext()

    log_event(logger, 20, "cli.command", "Executing command", command=args.command)

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
