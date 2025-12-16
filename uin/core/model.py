# path: uin/core/model.py
from uin.core.schema import UINDocument


def create_empty() -> UINDocument:
    return UINDocument(meta={}, shapes=[])
