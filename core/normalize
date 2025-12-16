# path: uin/core/normalize.py
from uin.core.schema import UINDocument
from uin.core.errors import NormalizationError


def normalize(doc: UINDocument) -> UINDocument:
    seen_ids = set()
    for shape in doc.shapes:
        if shape.id in seen_ids:
            raise NormalizationError(f"Duplicate shape id: {shape.id}")
        seen_ids.add(shape.id)
    return doc
