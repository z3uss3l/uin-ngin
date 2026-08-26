from pathlib import Path
from core.validation.schema_validator import SchemaValidator

SCHEMA_PATH = Path("docs/UINspec_v0.8_minimal.json")
FULL_SCHEMA_PATH = Path("docs/UINspecificationSchemaV08.json")
SAMPLE_DOC = Path("tests/fixtures/sample_uin_v08.json")


def test_schema_v08_valid():
    validator = SchemaValidator(SCHEMA_PATH)
    assert validator.validate(SAMPLE_DOC)


def test_full_schema_v08_is_valid_and_accepts_sample():
    validator = SchemaValidator(FULL_SCHEMA_PATH)
    assert validator.validate(SAMPLE_DOC)
