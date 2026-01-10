import shutil
import subprocess
import sys
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def has_cmd(cmd):
    return shutil.which(cmd) is not None


def run_node_bridge():
    print('Starting Node bridge...')
    p = subprocess.Popen(['node', 'comfyui-bridge.js'], cwd=ROOT / 'server')
    return p


def run_python_bridge():
    print('Starting Python bridge (uvicorn)...')
    p = subprocess.Popen([sys.executable, '-m', 'uvicorn', 'server.comfyui_bridge_py:app', '--port', '3001'], cwd=ROOT)
    return p


def serve_static(path, port=8000):
    import http.server, socketserver
    os.chdir(path)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        print(f"Serving {path} on http://127.0.0.1:{port}")
        httpd.serve_forever()


if __name__ == '__main__':
    processes = []
    try:
        if has_cmd('node'):
            processes.append(run_node_bridge())
        else:
            print('node not found — using Python bridge fallback')
            processes.append(run_python_bridge())

        # serve GUI demo
        gui_build = ROOT / 'packages' / 'uin-ui' / 'build'
        if gui_build.exists():
            print('Serving built UI from', gui_build)
            serve_static(str(gui_build), port=8000)
        else:
            print('Serving static demo GUI from public/gui.html at http://127.0.0.1:8000/gui')
            # serve root public folder
            serve_static(str(ROOT / 'public'), port=8000)

    except KeyboardInterrupt:
        print('Stopping...')
    finally:
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
