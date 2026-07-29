"""Datafile access: serialized writes, atomic replace, timestamped backups,
and mtime watching for external-edit detection. See docs/data-model.md.
"""

import json
import shutil
import threading
import time
from pathlib import Path

SKELETONS = {
    "trips": [],
    "event-classifications": {},
    "settings": {},
}
BACKUP_KEEP = 50


class DataStore:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.backup_dir = data_dir / "backups"
        self.lock = threading.Lock()
        self.data_dir.mkdir(exist_ok=True)
        self.backup_dir.mkdir(exist_ok=True)
        for name, skeleton in SKELETONS.items():
            path = self._path(name)
            if not path.exists():
                path.write_text(json.dumps(skeleton, indent=2))

    def _path(self, name: str) -> Path:
        assert name in SKELETONS, name
        return self.data_dir / f"{name}.json"

    def read(self, name: str):
        with self.lock:
            return json.loads(self._path(name).read_text())

    def write(self, name: str, value) -> None:
        path = self._path(name)
        with self.lock:
            stamp = time.strftime("%Y%m%d-%H%M%S")
            shutil.copy2(path, self.backup_dir / f"{name}.{stamp}.json")
            self._prune_backups(name)
            tmp = path.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(value, indent=2, ensure_ascii=False))
            tmp.replace(path)

    def _prune_backups(self, name: str) -> None:
        backups = sorted(self.backup_dir.glob(f"{name}.*.json"))
        for old in backups[:-BACKUP_KEEP]:
            old.unlink()

    def watch(self, interval: float = 1.0):
        """Yield {name: mtime} whenever any datafile's mtime changes."""
        last = None
        while True:
            current = {name: self._path(name).stat().st_mtime for name in SKELETONS}
            if last is not None and current != last:
                yield current
            last = current
            time.sleep(interval)
