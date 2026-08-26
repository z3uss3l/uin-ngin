"""Structured, opt-in logging for UIN-NGIN.

Environment:
  UIN_LOG_LEVEL=DEBUG|INFO|WARNING|ERROR|CRITICAL
  UIN_LOG_FORMAT=text|json
  UIN_LOG_FILE=/path/to/file.log (optional)
"""
from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any

_CONFIGURED = False


def _level() -> int:
    return getattr(logging, os.getenv("UIN_LOG_LEVEL", "INFO").upper(), logging.INFO)


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if hasattr(record, "event"):
            payload["event"] = record.event
        if hasattr(record, "context") and record.context:
            payload["context"] = record.context
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return
    root = logging.getLogger("uin")
    root.setLevel(_level())
    root.handlers.clear()
    fmt = _JsonFormatter() if os.getenv("UIN_LOG_FORMAT", "text").lower() == "json" else logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    handler: logging.Handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(fmt)
    root.addHandler(handler)
    logfile = os.getenv("UIN_LOG_FILE")
    if logfile:
        fh = logging.FileHandler(logfile, encoding="utf-8")
        fh.setFormatter(fmt)
        root.addHandler(fh)
    root.propagate = False
    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    configure_logging()
    return logging.getLogger(f"uin.{name}")


def log_event(logger: logging.Logger, level: int, event: str, message: str, **context: Any) -> None:
    logger.log(level, message, extra={"event": event, "context": context})
