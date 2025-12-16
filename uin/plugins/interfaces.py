# path: uin/plugins/interfaces.py
from abc import ABC, abstractmethod
from uin.core.schema import UINDocument


class Importer(ABC):
    @abstractmethod
    def import_data(self, source: bytes) -> UINDocument:
        pass


class Exporter(ABC):
    @abstractmethod
    def export(self, doc: UINDocument) -> bytes:
        pass


class Analyzer(ABC):
    @abstractmethod
    def analyze(self, doc: UINDocument) -> dict:
        pass
