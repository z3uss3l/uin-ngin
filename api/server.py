# path: uin_ngin/api/server.py
from fastapi import FastAPI
from uin_ngin.metrics.registry import MetricsRegistry

app = FastAPI()
metrics = MetricsRegistry()

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/metrics")
def get_metrics():
    return metrics.export()
