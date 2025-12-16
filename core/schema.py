# path: uin/core/schema.py
from pydantic import BaseModel, Field
from typing import List, Literal
from uin.core.version import SCHEMA_VERSION


class UINMeta(BaseModel):
    schema: str = Field(default=SCHEMA_VERSION)
    compatibility: Literal["strict", "compatible", "lossy"] = "strict"


class Color(BaseModel):
    r: int = Field(ge=0, le=255)
    g: int = Field(ge=0, le=255)
    b: int = Field(ge=0, le=255)
    a: float = Field(ge=0.0, le=1.0, default=1.0)


class Shape(BaseModel):
    id: str
    type: Literal["rect", "circle", "polygon"]
    x: float
    y: float
    width: float | None = None
    height: float | None = None
    radius: float | None = None
    color: Color


class UINDocument(BaseModel):
    meta: UINMeta
    shapes: List[Shape]
