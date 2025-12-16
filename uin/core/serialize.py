# path: uin/core/serialize.py
import json
from uin.core.schema import UINDocument


def serialize(doc: UINDocument) -> str:
    return json.dumps(doc.model_dump(mode="json"), sort_keys=True)
