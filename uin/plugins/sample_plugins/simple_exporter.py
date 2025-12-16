# path: uin/plugins/sample_plugins/simple_exporter.py
from uin.plugins.interfaces import Exporter
from uin.core.serialize import serialize
from uin.core.schema import UINDocument


class SimpleJSONExporter(Exporter):
    def export(self, doc: UINDocument) -> bytes:
        return serialize(doc).encode("utf-8")
