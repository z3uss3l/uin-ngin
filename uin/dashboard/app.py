# path: uin/dashboard/app.py
import uvicorn
from uin.dashboard.routes import app

def run_dashboard():
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    run_dashboard()
