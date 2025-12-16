# path: uin/core/validate.py
from uin.core.schema import UINDocument
from uin.core.errors import ValidationError


def validate(doc: UINDocument) -> None:
    if not doc.shapes:
        raise ValidationError("UIN document contains no shapes")
