# path: uin/pipeline/steps.py
import json
from uin.pipeline.context import PipelineContext
from uin.core.schema import UINDocument
from uin.core.normalize import normalize
from uin.core.validate import validate
from uin.core.serialize import serialize
from uin.core.errors import ValidationError
from uin.utils.logging import get_logger, log_event

logger = get_logger("pipeline")


def step_import(ctx: PipelineContext, raw: str) -> PipelineContext:
    log_event(logger, 10, "pipeline.import.start", "Parsing UIN JSON", bytes=len(raw.encode("utf-8")))
    data = json.loads(raw)
    ctx.doc = UINDocument.model_validate(data)
    log_event(logger, 20, "pipeline.import.success", "UIN document parsed", objects=len(getattr(ctx.doc, "objects", getattr(ctx.doc, "shapes", []))))
    return ctx


def step_normalize(ctx: PipelineContext) -> PipelineContext:
    log_event(logger, 10, "pipeline.normalize.start", "Normalizing UIN document")
    ctx.doc = normalize(ctx.doc)
    log_event(logger, 20, "pipeline.normalize.success", "UIN document normalized", objects=len(getattr(ctx.doc, "objects", getattr(ctx.doc, "shapes", []))))
    return ctx


def step_validate(ctx: PipelineContext) -> PipelineContext:
    log_event(logger, 10, "pipeline.validate.start", "Validating UIN document")
    validate(ctx.doc)
    log_event(logger, 20, "pipeline.validate.success", "UIN document validated", objects=len(getattr(ctx.doc, "objects", getattr(ctx.doc, "shapes", []))))
    return ctx


def step_export(ctx: PipelineContext) -> str:
    return serialize(ctx.doc)
