# path: uin/plugins/sample_plugins/simple_importer.py
from uin.plugins.interfaces import Importer
from uin.core.schema import UINDocument
import json


class SimpleJSONImporter(Importer):
    def import_data(self, source: bytes) -> UINDocument:
        data = json.loads(source.decode("utf-8"))
        return UINDocument.model_validate(data)
