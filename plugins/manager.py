# path: uin_ngin/plugins/manager.py
import importlib

class PluginManager:
    def load(self, module):
        return importlib.import_module(module)
