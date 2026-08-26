import json
import logging

from uin.utils.logging import _JsonFormatter


def test_json_log_formatter_contains_structured_fields():
    record = logging.LogRecord("uin.test", logging.INFO, __file__, 1, "hello", (), None)
    record.event = "test.event"
    record.context = {"object_id": "x1", "count": 2}
    payload = json.loads(_JsonFormatter().format(record))
    assert payload["level"] == "INFO"
    assert payload["event"] == "test.event"
    assert payload["context"]["object_id"] == "x1"


def test_logger_never_writes_structured_context_into_message():
    record = logging.LogRecord("uin.test", logging.INFO, __file__, 1, "plain message", (), None)
    record.event = "event"
    record.context = {"secret": "value"}
    payload = json.loads(_JsonFormatter().format(record))
    assert payload["message"] == "plain message"
    assert payload["context"]["secret"] == "value"
