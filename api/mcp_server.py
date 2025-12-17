# api/mcp_server.py
from mcp.server import Server
from core.utils.edge_extraction import create_uin_package  # statt subprocess

class UINMCPServer:
    def __init__(self):
        self.server = Server("uin-tools")
        # Tools registrieren...
        # call_tool: direkt Funktionen aufrufen (nicht subprocess → sauberer!)
