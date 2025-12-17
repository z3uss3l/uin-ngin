# path: uin_ngin/config/manager.py
import os, yaml

class ConfigManager:
    def __init__(self, path=None):
        self.config = {}
        if path:
            with open(path) as f:
                self.config = yaml.safe_load(f) or {}

    def get(self, key, default=None):
        return os.getenv(key.upper(), self.config.get(key, default))
