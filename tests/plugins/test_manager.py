# path: tests/plugins/test_manager.py
from uin.plugins.manager import PluginManager
from uin.core.schema import UINDocument, Shape, Color

def test_plugin_discovery():
    pm = PluginManager()
    pm.discover()
    assert "SimpleJSONImporter" in pm.importers
    assert "SimpleJSONExporter" in pm.exporters

    importer_cls = pm.get_importer("SimpleJSONImporter")
    exporter_cls = pm.get_exporter("SimpleJSONExporter")

    doc = UINDocument(
        meta={},
        shapes=[Shape(id="x", type="rect", x=0, y=0, width=1, height=1, color=Color(r=0,g=0,b=0))]
    )

    exporter = exporter_cls()
    raw = exporter.export(doc)
    imported_doc = importer_cls().import_data(raw)
    assert imported_doc.shapes[0].id == "x"
