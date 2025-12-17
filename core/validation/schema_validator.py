# core/validation/schema_validator.py
import json
from jsonschema import Draft7Validator
from pathlib import Path

class SchemaValidator:
    def __init__(self, schema_path: str):
        with open(schema_path, 'r', encoding='utf-8') as f:
            self.schema = json.load(f)
        self.validator = Draft7Validator(self.schema)

    def validate(self, doc_path: str) -> bool:
        with open(doc_path, 'r', encoding='utf-8') as f:
            doc = json.load(f)
        errors = sorted(self.validator.iter_errors(doc), key=lambda e: e.path)
        if errors:
            for e in errors:
                print(f"[SCHEMA] Fehler: {list(e.path)} -> {e.message}")
            return False
        print("[SCHEMA] OK: Dokument ist konform.")
        return True
