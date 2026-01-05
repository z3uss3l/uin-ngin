from pathlib import Path
from core.validation.schema_validator import SchemaValidator

SCHEMA_PATH = Path("docs/UINspec_v0.8_minimal.json")
SAMPLE_DOC = Path("tests/fixtures/sample_uin_v08.json")


def test_schema_v08_valid():
    validator = SchemaValidator(SCHEMA_PATH)
    assert validator.validate(SAMPLE_DOC)
