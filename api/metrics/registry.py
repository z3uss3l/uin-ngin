# path: uin_ngin/metrics/registry.py
class MetricsRegistry:
    def __init__(self):
        self.values = {}

    def record(self, key, value):
        self.values[key] = value

    def export(self):
        return self.values
