# path: uin_ngin/core/lifecycle.py
class LifecycleManager:
    def __init__(self):
        self.services = []

    def register(self, service):
        self.services.append(service)

    def start_all(self):
        for s in self.services:
            s.start()

    def stop_all(self):
        for s in reversed(self.services):
            s.stop()

    def health(self):
        return {s.name: s.health() for s in self.services}
