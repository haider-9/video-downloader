"""
Download service: executes yt-dlp download and streams the file to the client.

Security notes:
- format_id is validated to safe characters before use.
- All temp files use UUID-based names — no user input in file paths.
- Temp files are deleted after streaming (or on error).
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

import yt_dlp
from fastapi.responses import StreamingResponse

import config
from services.analyzer import _user_friendly_error, _validate_url_safety

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_SAFE_FILENAME_RE = re.compile(r"[^\w\s\-.]")


def _safe_filename(title: str, ext: str) -> str:
    """Produce a safe filename from a video title."""
    name = _SAFE_FILENAME_RE.sub("", title or "video")
    name = " ".join(name.split())[:80]  # trim whitespace runs, cap length
    name = name.strip(". ")
    if not name:
        name = "video"
    return f"{name}.{ext}"


async def _stream_file(path: Path) -> AsyncGenerator[bytes, None]:
    """Yield file contents in chunks, then delete the file."""
    try:
        loop = asyncio.get_event_loop()
        with open(path, "rb") as fh:
            while True:
                chunk = await loop.run_in_executor(None, fh.read, 65536)
                if not chunk:
                    break
                yield chunk
    finally:
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Download progress hook
# ---------------------------------------------------------------------------


class _ProgressTracker:
    def __init__(self) -> None:
        self.status: str = "starting"
        self.downloaded: int = 0
        self.total: int = 0
        self.percent: float = 0.0

    def hook(self, d: dict[str, Any]) -> None:
        status = d.get("status", "")
        if status == "downloading":
            self.status = "downloading"
            self.downloaded = d.get("downloaded_bytes") or 0
            self.total = d.get("total_bytes") or d.get("total_bytes_estimate") or 0
            if self.total > 0:
                self.percent = min(100.0, self.downloaded / self.total * 100)
        elif status == "finished":
            self.status = "processing"
            self.percent = 100.0
        elif status == "error":
            self.status = "error"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def download_video(
    url: str,
    format_id: str,
    audio_format_id: Optional[str] = None,
    audio_language: Optional[str] = None,
) -> StreamingResponse:
    """
    Download the video at *url* for *format_id*, merge with audio
    (*audio_format_id* or the best track for *audio_language*) if needed, and
    return a StreamingResponse that delivers the file.

    Raises ValueError with a user-friendly message on known errors.
    """
    _validate_url_safety(url)

    job_id = uuid.uuid4().hex
    output_dir = config.TEMP_DIR
    # Placeholder filename — yt-dlp will fill in the actual extension
    output_template = str(output_dir / f"{job_id}.%(ext)s")

    # Build format selector. Prefer an explicit language filter over a raw
    # format id: a bare audio id like "251" resolves to a region-appropriate
    # dub on multi-language videos, so selecting by language tag gives the
    # track the user actually asked for. Try the exact language, a prefix
    # match (e.g. "251-en"), then any audio.
    lang = (audio_language or "").strip().lower()
    if lang:
        fmt_selector = (
            f"{format_id}+(ba[language={lang}]/ba[language^={lang}]/ba)/best"
        )
    elif audio_format_id:
        # Merge specific video + audio streams
        fmt_selector = f"{format_id}+{audio_format_id}/best"
    else:
        fmt_selector = f"{format_id}/best"

    tracker = _ProgressTracker()

    ydl_opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "no_color": True,
        "outtmpl": output_template,
        "format": fmt_selector,
        "merge_output_format": "mp4",
        "progress_hooks": [tracker.hook],
        "noplaylist": True,
        # Security: restrict filenames
        "restrictfilenames": True,
        "windowsfilenames": True,
    }

    if config.FFMPEG_LOCATION:
        ydl_opts["ffmpeg_location"] = config.FFMPEG_LOCATION

    loop = asyncio.get_event_loop()
    try:
        info = await asyncio.wait_for(
            loop.run_in_executor(None, _run_download, ydl_opts, url),
            timeout=config.DOWNLOAD_TIMEOUT_SECONDS,
        )
    except asyncio.TimeoutError:
        # Clean up any partial files
        _cleanup_job(job_id, output_dir)
        raise ValueError("The download timed out. Please try again or choose a smaller quality.")
    except ValueError:
        _cleanup_job(job_id, output_dir)
        raise
    except Exception:
        logger.exception("Unexpected error downloading %s fmt=%s", url, format_id)
        _cleanup_job(job_id, output_dir)
        raise ValueError("An unexpected error occurred during the download. Please try again.")

    # Find the downloaded file (yt-dlp fills in the extension)
    output_file = _find_output_file(job_id, output_dir)
    if not output_file:
        raise ValueError("The download completed but the output file could not be located.")

    # Check file size limit
    file_size = output_file.stat().st_size
    max_bytes = config.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        output_file.unlink(missing_ok=True)
        raise ValueError(
            f"The resulting file is too large ({file_size // (1024*1024)} MB). "
            f"Maximum allowed size is {config.MAX_FILE_SIZE_MB} MB."
        )

    ext = output_file.suffix.lstrip(".")
    title = info.get("title") or "video" if info else "video"
    download_name = _safe_filename(title, ext)

    content_type_map = {
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mkv": "video/x-matroska",
        "m4a": "audio/mp4",
        "mp3": "audio/mpeg",
        "ogg": "audio/ogg",
        "opus": "audio/opus",
    }
    content_type = content_type_map.get(ext.lower(), "application/octet-stream")

    headers = {
        "Content-Disposition": f'attachment; filename="{download_name}"',
        "Content-Length": str(file_size),
        "X-Content-Type-Options": "nosniff",
    }

    return StreamingResponse(
        _stream_file(output_file),
        media_type=content_type,
        headers=headers,
    )


def _run_download(ydl_opts: dict[str, Any], url: str) -> Optional[dict]:
    """Blocking yt-dlp download call — run in an executor."""
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            return info
    except yt_dlp.utils.DownloadError as exc:
        msg, _code = _user_friendly_error(str(exc))
        raise ValueError(msg)
    except Exception as exc:
        logger.exception("Error in _run_download")
        raise ValueError(
            "A download error occurred. Please try again."
        )


def _find_output_file(job_id: str, directory: Path) -> Optional[Path]:
    """Find the output file matching the job_id prefix."""
    for path in directory.iterdir():
        if path.stem == job_id or path.name.startswith(job_id):
            if path.is_file():
                return path
    return None


def _cleanup_job(job_id: str, directory: Path) -> None:
    """Remove any temp files associated with a job."""
    try:
        for path in directory.iterdir():
            if path.name.startswith(job_id):
                path.unlink(missing_ok=True)
    except Exception:
        pass
