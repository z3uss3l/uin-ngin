# path: uin/pipeline/context.py
from uin.core.schema import UINDocument


class PipelineContext:
    def __init__(self, doc: UINDocument | None = None):
        self.doc = doc
        self.metrics: dict = {}
