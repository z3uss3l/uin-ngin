"""Diagnostics helpers for support/debug sessions."""
from __future__ import annotations

import platform
import sys

from uin.core.version import UIN_VERSION


def environment_report() -> dict[str, str]:
    return {
        "uin_version": UIN_VERSION,
        "python": platform.python_version(),
        "platform": platform.platform(),
        "implementation": platform.python_implementation(),
        "executable": sys.executable,
    }
