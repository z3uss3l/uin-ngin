# path: tests/core/test_roundtrip.py
from uin.core.schema import UINDocument, Shape, Color
from uin.core.serialize import serialize
from uin.core.normalize import normalize


def test_roundtrip_deterministic():
    doc = UINDocument(
        meta={},
        shapes=[
            Shape(
                id="a",
                type="rect",
                x=0,
                y=0,
                width=10,
                height=10,
                color=Color(r=0, g=0, b=0),
            )
        ],
    )

    s1 = serialize(normalize(doc))
    s2 = serialize(normalize(doc))
    assert s1 == s2
