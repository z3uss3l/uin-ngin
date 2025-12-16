# path: uin/plugins/manager.py
import importlib
import pkgutil
from pathlib import Path
from typing import Type
from uin.plugins.interfaces import Importer, Exporter, Analyzer


class PluginManager:
    def __init__(self):
        self.importers: dict[str, Type[Importer]] = {}
        self.exporters: dict[str, Type[Exporter]] = {}
        self.analyzers: dict[str, Type[Analyzer]] = {}

    def discover(self, package_name="uin.plugins.sample_plugins"):
        package = importlib.import_module(package_name)
        for _, modname, ispkg in pkgutil.iter_modules(package.__path__):
            if ispkg:
                continue
            module = importlib.import_module(f"{package_name}.{modname}")
            self._register_from_module(module)

    def _register_from_module(self, module):
        for attr in dir(module):
            cls = getattr(module, attr)
            if isinstance(cls, type):
                if issubclass(cls, Importer) and cls is not Importer:
                    self.importers[cls.__name__] = cls
                if issubclass(cls, Exporter) and cls is not Exporter:
                    self.exporters[cls.__name__] = cls
                if issubclass(cls, Analyzer) and cls is not Analyzer:
                    self.analyzers[cls.__name__] = cls

    def get_importer(self, name) -> Type[Importer]:
        return self.importers[name]

    def get_exporter(self, name) -> Type[Exporter]:
        return self.exporters[name]

    def get_analyzer(self, name) -> Type[Analyzer]:
        return self.analyzers[name]
