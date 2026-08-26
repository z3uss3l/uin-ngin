# UIN-NGIN Logging / Debugging

## Python

Environment variables:

```text
UIN_LOG_LEVEL=DEBUG|INFO|WARNING|ERROR|CRITICAL
UIN_LOG_FORMAT=text|json
UIN_LOG_FILE=/tmp/uin-ngin.log
```

The CLI also accepts `--log-level` and `--log-format`. Logs go to stderr so JSON/stdout pipelines remain machine-readable.

## Diagnostics

```python
from uin.debug import environment_report
print(environment_report())
```

The project deliberately does not log image bytes, API keys, bearer tokens, or complete imported documents.
