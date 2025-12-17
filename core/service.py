# path: uin_ngin/core/service.py
from abc import ABC, abstractmethod

class Service(ABC):
    name: str = "service"

    def start(self): pass
    def stop(self): pass
    def health(self) -> dict:
        return {"status": "ok", "service": self.name}
