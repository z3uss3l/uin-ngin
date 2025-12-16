# path: uin/dashboard/routes.py
from fastapi import FastAPI
from uin.dashboard.monitor import DashboardMonitor

app = FastAPI()
monitor = DashboardMonitor()

@app.get("/metrics")
def get_metrics():
    return monitor.get_metrics()

@app.post("/record/{metric_name}")
def record_metric(metric_name: str, value: float):
    monitor.record_metric(metric_name, value)
    return {"status": "ok"}

@app.get("/summary")
def summary():
    return {"summary": monitor.summary()}
