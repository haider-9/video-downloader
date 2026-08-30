"""
Background cleanup task: removes stale temporary files from TEMP_DIR.
Runs periodically to prevent temp files from accumulating.
"""

from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path

import config

logger = logging.getLogger(__name__)


async def cleanup_loop() -> None:
    """Continuously sweep TEMP_DIR and delete files older than FILE_TTL_SECONDS."""
    while True:
        try:
            await asyncio.sleep(60)  # run every minute
            _sweep(config.TEMP_DIR, config.FILE_TTL_SECONDS)
        except asyncio.CancelledError:
            break
        except Exception:
            logger.exception("Error in cleanup loop")


def _sweep(directory: Path, ttl_seconds: int) -> None:
    if not directory.exists():
        return
    now = time.time()
    removed = 0
    for path in directory.iterdir():
        if not path.is_file():
            continue
        try:
            age = now - path.stat().st_mtime
            if age > ttl_seconds:
                path.unlink(missing_ok=True)
                removed += 1
        except Exception:
            pass
    if removed:
        logger.info("Cleanup: removed %d stale temp file(s)", removed)
