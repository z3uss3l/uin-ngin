# path: uin_ngin/metrics/prometheus.py
def export_prometheus(metrics: dict) -> str:
    return "\n".join(f"{k} {v}" for k,v in metrics.items())
