# path: uin_ngin/main.py
from uin_ngin.core.lifecycle import LifecycleManager
from uin_ngin.api.server import app
import uvicorn

def run(args):
    if args.mode == "api":
        uvicorn.run(app, port=8000)
