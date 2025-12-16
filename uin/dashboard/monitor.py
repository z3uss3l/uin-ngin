# path: uin/dashboard/monitor.py
from uin.core.schema import UINDocument

class DashboardMonitor:
    def __init__(self):
        self.metrics = {}

    def record_metric(self, name: str, value):
        self.metrics[name] = value

    def get_metrics(self):
        return self.metrics

    def summary(self):
        return "\n".join(f"{k}: {v}" for k,v in self.metrics.items())
