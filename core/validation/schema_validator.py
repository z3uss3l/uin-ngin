import json
from jsonschema import Draft7Validator
from pathlib import Path

def load_schema(path: Path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

class SchemaValidator:
    def __init__(self, schema_path: Path):
        self.schema = load_schema(schema_path)
        self.validator = Draft7Validator(self.schema)

    def validate(self, doc_path: Path) -> bool:
        with open(doc_path, 'r', encoding='utf-8') as f:
            doc = json.load(f)
        errors = sorted(self.validator.iter_errors(doc), key=lambda e: e.path)
        if errors:
            for e in errors:
                print(f"[SCHEMA] Fehler: {list(e.path)} -> {e.message}")
            return False
        print("[SCHEMA] OK: Dokument ist konform zu v0.8.")
        return True
