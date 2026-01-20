echo Starting FastAPI on http://127.0.0.1:8000
echo Press CTRL+C to stop.

python -m uvicorn uin.api.app:app --host 127.0.0.1 --port 8000
