# path: uin/pipeline/steps.py
import json
from uin.pipeline.context import PipelineContext
from uin.core.schema import UINDocument
from uin.core.normalize import normalize
from uin.core.validate import validate
from uin.core.serialize import serialize
from uin.core.errors import ValidationError


def step_import(ctx: PipelineContext, raw: str) -> PipelineContext:
    data = json.loads(raw)
    ctx.doc = UINDocument.model_validate(data)
    return ctx


def step_normalize(ctx: PipelineContext) -> PipelineContext:
    ctx.doc = normalize(ctx.doc)
    return ctx


def step_validate(ctx: PipelineContext) -> PipelineContext:
    validate(ctx.doc)
    return ctx


def step_export(ctx: PipelineContext) -> str:
    return serialize(ctx.doc)
